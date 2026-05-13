package com.nemo.timetracking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;

public interface UserRateRepository extends JpaRepository<UserRate, Long> {

    @Query("SELECT ur FROM UserRate ur WHERE ur.user.id = :userId AND ur.effectiveFrom <= :date ORDER BY ur.effectiveFrom DESC LIMIT 1")
    Optional<UserRate> findEffectiveRate(Long userId, LocalDate date);

    @Query("SELECT ur FROM UserRate ur WHERE ur.user.id = :userId ORDER BY ur.effectiveFrom DESC")
    java.util.List<UserRate> findByUserIdOrderByEffectiveFromDesc(Long userId);
}