package com.nemo.phase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DeliverableRepository extends JpaRepository<Deliverable, Long> {

    List<Deliverable> findByPhaseId(Long phaseId);

    List<Deliverable> findByPhaseProjectId(Long projectId);

    @Query("SELECT d FROM Deliverable d JOIN FETCH d.phase WHERE d.phase.project.id IN :projectIds ORDER BY d.dueDate ASC")
    List<Deliverable> findByProjectProgramId(@Param("projectIds") List<Long> projectIds);

    long countByPhaseId(Long phaseId);

    @Query("SELECT d.phase.id, COUNT(d) FROM Deliverable d WHERE d.phase.id IN :phaseIds GROUP BY d.phase.id")
    List<Object[]> countByPhaseIds(@Param("phaseIds") List<Long> phaseIds);

    void deleteByPhaseId(Long phaseId);
}