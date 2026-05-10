package com.jari.location;

import com.jari.asset.AssetRepository;
import com.jari.common.exception.BadRequestException;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.company.Company;
import com.jari.company.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LocationService {

    private final LocationRepository locationRepository;
    private final CompanyRepository companyRepository;
    private final AssetRepository assetRepository;

    public LocationService(LocationRepository locationRepository,
                           CompanyRepository companyRepository,
                           AssetRepository assetRepository) {
        this.locationRepository = locationRepository;
        this.companyRepository = companyRepository;
        this.assetRepository = assetRepository;
    }

    @Transactional(readOnly = true)
    public List<LocationDto> listByCompany(Long companyId) {
        List<Location> locations = companyId != null
                ? locationRepository.findByCompanyIdAndActiveTrueOrderByIdAsc(companyId)
                : locationRepository.findByActiveTrueOrderByIdAsc();
        List<LocationDto> dtos = enrichWithAssetCounts(locations);
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<LocationDto> getTree(Long companyId) {
        List<Location> all = companyId != null
                ? locationRepository.findByCompanyIdAndActiveTrueOrderByIdAsc(companyId)
                : locationRepository.findByActiveTrueOrderByIdAsc();

        Map<Long, Long> assetCountMap = buildAssetCountMap(all);

        Map<Long, List<Location>> byParent = all.stream()
                .collect(Collectors.groupingBy(l -> l.getParent() != null ? l.getParent().getId() : -1L));

        List<Location> roots = all.stream()
                .filter(l -> l.getParent() == null)
                .sorted(Comparator.comparingInt(l -> l.getOrder() != null ? l.getOrder() : Integer.MAX_VALUE))
                .toList();

        return roots.stream()
                .map(root -> buildTreeDto(root, byParent, assetCountMap))
                .toList();
    }

    @Transactional(readOnly = true)
    public Location getById(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location", id));
    }

    @Transactional
    public Location create(LocationDto.CreateRequest request) {
        Location location = new Location();
        location.setName(request.name());
        location.setDescription(request.description());
        location.setOrder(request.order());

        if (request.parentId() != null) {
            Location parent = locationRepository.findById(request.parentId())
                    .orElseThrow(() -> new EntityNotFoundException("Location", request.parentId()));
            location.setParent(parent);
        }

        if (request.companyId() != null) {
            Company company = companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new EntityNotFoundException("Company", request.companyId()));
            location.setCompany(company);
        }

        return locationRepository.save(location);
    }

    @Transactional
    public Location update(Long id, LocationDto.UpdateRequest request) {
        Location location = getById(id);

        if (request.name() != null) location.setName(request.name());
        if (request.description() != null) location.setDescription(request.description());
        if (request.order() != null) location.setOrder(request.order());
        if (request.active() != null) location.setActive(request.active());

        if (request.parentId() != null) {
            if (request.parentId().equals(id)) {
                throw new BadRequestException("A location cannot be its own parent");
            }
            if (isDescendant(id, request.parentId())) {
                throw new BadRequestException("Circular reference detected: cannot set a descendant as parent");
            }
            Location parent = locationRepository.findById(request.parentId())
                    .orElseThrow(() -> new EntityNotFoundException("Location", request.parentId()));
            location.setParent(parent);
        } else if (request.parentId() != null && request.parentId().equals(-1L)) {
            // Use -1 as sentinel for "set to root"
            location.setParent(null);
        }

        return locationRepository.save(location);
    }

    @Transactional
    public void deactivate(Long id) {
        Location location = getById(id);
        location.setActive(false);
        locationRepository.save(location);
    }

    private boolean isDescendant(Long ancestorId, Long potentialDescendantId) {
        Set<Long> visited = new HashSet<>();
        Long current = potentialDescendantId;
        while (current != null) {
            if (current.equals(ancestorId)) return true;
            if (visited.contains(current)) break;
            visited.add(current);
            Location loc = locationRepository.findById(current).orElse(null);
            if (loc == null || loc.getParent() == null) break;
            current = loc.getParent().getId();
        }
        return false;
    }

    private List<LocationDto> enrichWithAssetCounts(List<Location> locations) {
        Map<Long, Long> assetCountMap = buildAssetCountMap(locations);
        return locations.stream()
                .map(loc -> {
                    LocationDto dto = toSimpleDto(loc);
                    return new LocationDto(
                            dto.id(), dto.name(), dto.description(),
                            dto.parentId(), dto.parentName(),
                            dto.companyId(), dto.companyName(),
                            dto.order(), dto.active(),
                            assetCountMap.getOrDefault(dto.id(), 0L),
                            List.of(),
                            dto.createdAt(), dto.updatedAt());
                })
                .toList();
    }

    private LocationDto toSimpleDto(Location loc) {
        return new LocationDto(
                loc.getId(),
                loc.getName(),
                loc.getDescription(),
                loc.getParent() != null ? loc.getParent().getId() : null,
                loc.getParent() != null ? loc.getParent().getName() : null,
                loc.getCompany() != null ? loc.getCompany().getId() : null,
                loc.getCompany() != null ? loc.getCompany().getName() : null,
                loc.getOrder(),
                loc.isActive(),
                0L,
                List.of(),
                loc.getCreatedAt() != null ? loc.getCreatedAt().toString() : null,
                loc.getUpdatedAt() != null ? loc.getUpdatedAt().toString() : null
        );
    }

    private LocationDto buildTreeDto(Location loc, Map<Long, List<Location>> byParent, Map<Long, Long> assetCountMap) {
        List<Location> children = byParent.getOrDefault(loc.getId(), List.of());
        List<LocationDto> childDtos = children.stream()
                .sorted(Comparator.comparingInt(l -> l.getOrder() != null ? l.getOrder() : Integer.MAX_VALUE))
                .map(child -> buildTreeDto(child, byParent, assetCountMap))
                .toList();

        return new LocationDto(
                loc.getId(),
                loc.getName(),
                loc.getDescription(),
                loc.getParent() != null ? loc.getParent().getId() : null,
                loc.getParent() != null ? loc.getParent().getName() : null,
                loc.getCompany() != null ? loc.getCompany().getId() : null,
                loc.getCompany() != null ? loc.getCompany().getName() : null,
                loc.getOrder(),
                loc.isActive(),
                assetCountMap.getOrDefault(loc.getId(), 0L),
                childDtos,
                loc.getCreatedAt() != null ? loc.getCreatedAt().toString() : null,
                loc.getUpdatedAt() != null ? loc.getUpdatedAt().toString() : null
        );
    }

    private Map<Long, Long> buildAssetCountMap(List<Location> locations) {
        List<Long> locationIds = locations.stream().map(Location::getId).toList();
        if (locationIds.isEmpty()) return Map.of();
        return assetRepository.countByLocationIdIn(locationIds).stream()
                .collect(Collectors.toMap(
                        arr -> (Long) arr[0],
                        arr -> (Long) arr[1]
                ));
    }
}