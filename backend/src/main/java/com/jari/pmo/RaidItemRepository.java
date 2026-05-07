package com.jari.pmo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RaidItemRepository extends JpaRepository<RaidItem, Long> {

    List<RaidItem> findByProjectId(Long projectId);

    List<RaidItem> findByProjectIdAndType(Long projectId, RaidItem.RaidType type);

    List<RaidItem> findByType(RaidItem.RaidType type);

    List<RaidItem> findByStatusIn(List<RaidItem.RaidStatus> statuses);

    List<RaidItem> findByTypeAndStatusIn(RaidItem.RaidType type, List<RaidItem.RaidStatus> statuses);

    long countByProjectIdAndType(Long projectId, RaidItem.RaidType type);

    long countByProjectIdAndStatus(Long projectId, RaidItem.RaidStatus status);
}