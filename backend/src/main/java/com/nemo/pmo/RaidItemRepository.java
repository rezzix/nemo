package com.nemo.pmo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RaidItemRepository extends JpaRepository<RaidItem, Long> {

    List<RaidItem> findByProjectId(Long projectId);

    List<RaidItem> findByProjectIdAndType(Long projectId, RaidItem.RaidType type);

    List<RaidItem> findByType(RaidItem.RaidType type);

    List<RaidItem> findByStatusIn(List<RaidItem.RaidStatus> statuses);

    List<RaidItem> findByTypeAndStatusIn(RaidItem.RaidType type, List<RaidItem.RaidStatus> statuses);

    long countByProjectIdAndType(Long projectId, RaidItem.RaidType type);

    long countByProjectIdAndStatus(Long projectId, RaidItem.RaidStatus status);

    @Query("SELECT r FROM RaidItem r WHERE (:companyId IS NULL OR r.project.company.id = :companyId)")
    List<RaidItem> findByCompanyIdOrNull(@Param("companyId") Long companyId);

    @Query("SELECT r FROM RaidItem r WHERE (:companyId IS NULL OR r.project.company.id = :companyId) AND (:type IS NULL OR r.type = :type)")
    List<RaidItem> findByCompanyIdAndType(@Param("companyId") Long companyId, @Param("type") RaidItem.RaidType type);
}