package com.nemo.leave;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByUserIdOrderByStartDateDesc(Long userId);

    List<LeaveRequest> findByStatus(LeaveRequest.Status status);

    List<LeaveRequest> findByUserIdAndStatus(Long userId, LeaveRequest.Status status);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = :status AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findByStatusAndDateRange(LeaveRequest.Status status, LocalDate startDate, LocalDate endDate);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findByDateRange(LocalDate startDate, LocalDate endDate);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.user.company.id = :companyId ORDER BY lr.startDate DESC")
    List<LeaveRequest> findByCompanyId(Long companyId);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = 'PENDING' ORDER BY lr.startDate ASC")
    List<LeaveRequest> findPending();

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.user.company.id = :companyId AND lr.status = :status ORDER BY lr.startDate DESC")
    List<LeaveRequest> findByCompanyIdAndStatus(Long companyId, LeaveRequest.Status status);

    @Query("SELECT lr FROM LeaveRequest lr WHERE " +
           "(:userId IS NULL OR lr.user.id = :userId) AND " +
           "(:status IS NULL OR lr.status = :status) AND " +
           "(:companyId IS NULL OR lr.user.company.id = :companyId) AND " +
           "(:startDate IS NULL OR lr.startDate >= :startDate) AND " +
           "(:endDate IS NULL OR lr.endDate <= :endDate) " +
           "ORDER BY lr.startDate DESC")
    List<LeaveRequest> search(@Param("userId") Long userId, @Param("status") LeaveRequest.Status status,
                              @Param("companyId") Long companyId, @Param("startDate") LocalDate startDate,
                              @Param("endDate") LocalDate endDate);

    long countByUserIdAndTypeAndStatus(Long userId, LeaveRequest.Type type, LeaveRequest.Status status);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.user.id = :userId AND lr.type = :type AND lr.status = 'APPROVED' AND lr.startDate <= :yearEnd AND lr.endDate >= :yearStart")
    List<LeaveRequest> findApprovedByUserAndTypeInYear(@Param("userId") Long userId, @Param("type") LeaveRequest.Type type, @Param("yearStart") LocalDate yearStart, @Param("yearEnd") LocalDate yearEnd);
}