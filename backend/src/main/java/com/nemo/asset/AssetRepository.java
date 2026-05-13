package com.nemo.asset;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByCompanyIdAndActiveTrue(Long companyId);

    List<Asset> findByCompanyIdAndTypeAndActiveTrue(Long companyId, Asset.Type type);

    List<Asset> findByCompanyIdAndStatusAndActiveTrue(Long companyId, Asset.Status status);

    List<Asset> findByUserIdAndActiveTrue(Long userId);

    List<Asset> findByLocationIdAndActiveTrue(Long locationId);

    long countByLocationId(Long locationId);

    @Query("SELECT a.location.id, COUNT(a) FROM Asset a WHERE a.location.id IN :ids AND a.active = true GROUP BY a.location.id")
    List<Object[]> countByLocationIdIn(@Param("ids") List<Long> ids);

    @Query("SELECT a FROM Asset a WHERE a.active = true AND " +
            "(:companyId IS NULL OR a.company.id = :companyId) AND " +
            "(:type IS NULL OR a.type = :type) AND " +
            "(:status IS NULL OR a.status = :status) AND " +
            "(:locationId IS NULL OR a.location.id = :locationId) AND " +
            "(:userId IS NULL OR a.user.id = :userId)")
    List<Asset> findByFilters(@Param("companyId") Long companyId,
                              @Param("type") Asset.Type type,
                              @Param("status") Asset.Status status,
                              @Param("locationId") Long locationId,
                              @Param("userId") Long userId);
}