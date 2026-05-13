package com.nemo.common.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    @Query("SELECT a FROM ActivityLog a WHERE " +
            "(:username IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :username, '%'))) " +
            "AND a.createdAt BETWEEN :startDate AND :endDate")
    Page<ActivityLog> search(@Param("username") String username,
                             @Param("startDate") Instant startDate,
                             @Param("endDate") Instant endDate,
                             Pageable pageable);
}