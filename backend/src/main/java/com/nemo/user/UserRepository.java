package com.nemo.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Page<User> findByRole(User.Role role, Pageable pageable);

    Page<User> findByActive(boolean active, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> search(String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           "(:companyId IS NULL OR u.company.id = :companyId OR u.company.id IS NULL) AND " +
           "(:search IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchByCompanyOrGlobal(String search, Long companyId, Pageable pageable);

    @Query("SELECT u FROM User u WHERE (:companyId IS NULL OR u.company.id = :companyId OR u.company.id IS NULL)")
    Page<User> findByCompanyOrGlobal(Long companyId, Pageable pageable);

    long countByActive(boolean active);

    @Query("SELECT u.role, COUNT(u) FROM User u GROUP BY u.role")
    List<Object[]> countByRole();

    @Query("SELECT u.department, COUNT(u) FROM User u WHERE u.department IS NOT NULL GROUP BY u.department")
    List<Object[]> countByDepartment();

    @Query("SELECT u.company.name, COUNT(u) FROM User u WHERE u.role <> 'EXTERNAL' GROUP BY u.company.name")
    List<Object[]> countByCompany();

    @Query("SELECT u.active, COUNT(u) FROM User u WHERE u.role <> 'EXTERNAL' GROUP BY u.active")
    List<Object[]> countByActiveStatus();
}