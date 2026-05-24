package com.nemo.leave;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaveEntitlementRepository extends JpaRepository<LeaveEntitlement, Long> {

    List<LeaveEntitlement> findByUserIdAndYear(Long userId, int year);

    Optional<LeaveEntitlement> findByUserIdAndTypeAndYear(Long userId, LeaveRequest.Type type, int year);

    List<LeaveEntitlement> findByUserId(Long userId);

    List<LeaveEntitlement> findByYear(int year);
}