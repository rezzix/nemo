package com.nemo.asset;

import com.nemo.common.exception.BadRequestException;
import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.company.Company;
import com.nemo.company.CompanyRepository;
import com.nemo.location.Location;
import com.nemo.location.LocationRepository;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class AssetService {

    private final AssetRepository assetRepository;
    private final LocationRepository locationRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public AssetService(AssetRepository assetRepository,
                        LocationRepository locationRepository,
                        CompanyRepository companyRepository,
                        UserRepository userRepository) {
        this.assetRepository = assetRepository;
        this.locationRepository = locationRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Asset> listByFilters(Long companyId, Asset.Type type, Asset.Status status,
                                      Long locationId, Long userId) {
        return assetRepository.findByFilters(companyId, type, status, locationId, userId);
    }

    @Transactional(readOnly = true)
    public Asset getById(Long id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Asset", id));
    }

    @Transactional
    public Asset create(AssetDto.CreateRequest request) {
        Asset asset = new Asset();
        asset.setName(request.name());
        asset.setDescription(request.description());
        asset.setType(Asset.Type.valueOf(request.type()));
        asset.setIdentifier(request.identifier());
        asset.setStatus(request.status() != null ? Asset.Status.valueOf(request.status()) : Asset.Status.IN_STOCK);

        if (request.locationId() != null) {
            Location location = locationRepository.findById(request.locationId())
                    .orElseThrow(() -> new EntityNotFoundException("Location", request.locationId()));
            asset.setLocation(location);
        }

        if (request.userId() != null) {
            User user = userRepository.findById(request.userId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.userId()));
            asset.setUser(user);
            if (request.locationId() == null) {
                asset.setStatus(Asset.Status.ASSIGNED);
            }
        }

        // Cannot have both location and user
        if (asset.getLocation() != null && asset.getUser() != null) {
            throw new BadRequestException("An asset cannot be assigned to both a location and a user simultaneously");
        }

        if (request.companyId() != null) {
            Company company = companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new EntityNotFoundException("Company", request.companyId()));
            asset.setCompany(company);
        }

        if (request.purchaseDate() != null && !request.purchaseDate().isBlank()) {
            asset.setPurchaseDate(LocalDate.parse(request.purchaseDate()));
        }
        asset.setPurchaseCost(request.purchaseCost());
        asset.setNotes(request.notes());

        return assetRepository.save(asset);
    }

    @Transactional
    public Asset update(Long id, AssetDto.UpdateRequest request) {
        Asset asset = getById(id);

        if (request.name() != null) asset.setName(request.name());
        if (request.description() != null) asset.setDescription(request.description());
        if (request.type() != null) asset.setType(Asset.Type.valueOf(request.type()));
        if (request.identifier() != null) asset.setIdentifier(request.identifier());
        if (request.status() != null) asset.setStatus(Asset.Status.valueOf(request.status()));
        if (request.purchaseCost() != null) asset.setPurchaseCost(request.purchaseCost());
        if (request.notes() != null) asset.setNotes(request.notes());

        if (request.purchaseDate() != null) {
            asset.setPurchaseDate(request.purchaseDate().isBlank() ? null : LocalDate.parse(request.purchaseDate()));
        }

        if (request.locationId() != null) {
            if (request.locationId() == -1) {
                asset.setLocation(null);
            } else {
                Location location = locationRepository.findById(request.locationId())
                        .orElseThrow(() -> new EntityNotFoundException("Location", request.locationId()));
                asset.setLocation(location);
                // If placing at a location, remove user assignment
                if (asset.getUser() != null) {
                    asset.setUser(null);
                    if (asset.getStatus() == Asset.Status.ASSIGNED) {
                        asset.setStatus(Asset.Status.IN_USE);
                    }
                }
            }
        }

        if (request.companyId() != null) {
            if (request.companyId() == -1) {
                asset.setCompany(null);
            } else {
                Company company = companyRepository.findById(request.companyId())
                        .orElseThrow(() -> new EntityNotFoundException("Company", request.companyId()));
                asset.setCompany(company);
            }
        }

        // Ensure mutual exclusivity
        if (asset.getLocation() != null && asset.getUser() != null) {
            throw new BadRequestException("An asset cannot be assigned to both a location and a user simultaneously");
        }

        return assetRepository.save(asset);
    }

    @Transactional
    public Asset assignToUser(Long id, Long userId) {
        Asset asset = getById(id);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        asset.setUser(user);
        asset.setLocation(null); // Remove location when assigning to user
        asset.setStatus(Asset.Status.ASSIGNED);

        return assetRepository.save(asset);
    }

    @Transactional
    public Asset unassign(Long id) {
        Asset asset = getById(id);
        asset.setUser(null);
        asset.setStatus(Asset.Status.IN_STOCK);

        return assetRepository.save(asset);
    }

    @Transactional
    public void deactivate(Long id) {
        Asset asset = getById(id);
        asset.setActive(false);
        assetRepository.save(asset);
    }
}