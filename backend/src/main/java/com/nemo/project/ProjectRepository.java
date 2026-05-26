package com.nemo.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    boolean existsByKey(String key);

    long countByProgramId(Long programId);

    @Query("SELECT p FROM Project p WHERE " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:programId IS NULL OR p.program.id = :programId) AND " +
           "(:managerId IS NULL OR p.manager.id = :managerId) AND " +
           "(:companyId IS NULL OR p.company.id = :companyId OR p.company.id IS NULL)")
    Page<Project> search(String search, Long programId, Long managerId, Long companyId, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
           "AND (:companyId IS NULL OR p.company.id = :companyId OR p.company.id IS NULL)")
    Page<Project> findByMemberUserIdAndCompany(Long userId, Long companyId, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE (:companyId IS NULL OR p.company.id = :companyId OR p.company.id IS NULL)")
    Page<Project> findByCompanyIdOrNull(Long companyId, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE (:companyId IS NULL OR p.company.id = :companyId OR p.company.id IS NULL)")
    List<Project> findAllByCompanyIdOrNull(Long companyId);
}