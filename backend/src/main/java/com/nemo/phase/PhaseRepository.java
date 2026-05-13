package com.nemo.phase;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhaseRepository extends JpaRepository<Phase, Long> {

    List<Phase> findByProjectIdOrderByPositionAsc(Long projectId);

    List<Phase> findByProjectIdInOrderByProjectIdAscPositionAsc(List<Long> projectIds);

    List<Phase> findByProjectIdAndStatusOrderByPositionAsc(Long projectId, Phase.PhaseStatus status);

    long countByProjectId(Long projectId);
}