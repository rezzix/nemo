package com.jari.leave;

import com.jari.common.exception.BadRequestException;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.user.User;
import com.jari.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;

    public LeaveRequestService(LeaveRequestRepository leaveRequestRepository, UserRepository userRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> list(Long userId, LeaveRequest.Status status, Long companyId, LocalDate startDate, LocalDate endDate) {
        if (userId != null && status != null) {
            return leaveRequestRepository.findByUserIdAndStatus(userId, status);
        }
        if (userId != null) {
            return leaveRequestRepository.findByUserIdOrderByStartDateDesc(userId);
        }
        if (status != null) {
            return leaveRequestRepository.findByStatus(status);
        }
        if (companyId != null) {
            return leaveRequestRepository.findByCompanyId(companyId);
        }
        if (startDate != null && endDate != null) {
            return leaveRequestRepository.findByDateRange(startDate, endDate);
        }
        return leaveRequestRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> listPending() {
        return leaveRequestRepository.findPending();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> listByCompanyAndStatus(Long companyId, LeaveRequest.Status status) {
        return leaveRequestRepository.findByCompanyIdAndStatus(companyId, status);
    }

    @Transactional(readOnly = true)
    public LeaveRequest getById(Long id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LeaveRequest", id));
    }

    @Transactional
    public LeaveRequest create(Long userId, LeaveRequestDto.CreateRequest request) {
        if (request.startDate().isAfter(request.endDate())) {
            throw new BadRequestException("Start date must be before or equal to end date");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        LeaveRequest lr = new LeaveRequest();
        lr.setUser(user);
        lr.setType(request.type());
        lr.setStartDate(request.startDate());
        lr.setEndDate(request.endDate());
        lr.setReason(request.reason());
        lr.setStatus(LeaveRequest.Status.PENDING);
        return leaveRequestRepository.save(lr);
    }

    @Transactional
    public LeaveRequest update(Long id, Long userId, LeaveRequestDto.UpdateRequest request) {
        LeaveRequest lr = getById(id);
        if (!lr.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only update your own leave requests");
        }
        if (lr.getStatus() != LeaveRequest.Status.PENDING) {
            throw new BadRequestException("Only pending requests can be updated");
        }
        if (request.type() != null) lr.setType(request.type());
        if (request.startDate() != null) lr.setStartDate(request.startDate());
        if (request.endDate() != null) lr.setEndDate(request.endDate());
        if (request.reason() != null) lr.setReason(request.reason());
        if (lr.getStartDate().isAfter(lr.getEndDate())) {
            throw new BadRequestException("Start date must be before or equal to end date");
        }
        return leaveRequestRepository.save(lr);
    }

    @Transactional
    public LeaveRequest approve(Long id, Long approverId, String comment) {
        LeaveRequest lr = getById(id);
        if (lr.getStatus() != LeaveRequest.Status.PENDING) {
            throw new BadRequestException("Only pending requests can be approved");
        }
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new EntityNotFoundException("User", approverId));
        lr.setStatus(LeaveRequest.Status.APPROVED);
        lr.setApprover(approver);
        lr.setApproverComment(comment);
        return leaveRequestRepository.save(lr);
    }

    @Transactional
    public LeaveRequest reject(Long id, Long approverId, String comment) {
        LeaveRequest lr = getById(id);
        if (lr.getStatus() != LeaveRequest.Status.PENDING) {
            throw new BadRequestException("Only pending requests can be rejected");
        }
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new EntityNotFoundException("User", approverId));
        lr.setStatus(LeaveRequest.Status.REJECTED);
        lr.setApprover(approver);
        lr.setApproverComment(comment);
        return leaveRequestRepository.save(lr);
    }

    @Transactional
    public void cancel(Long id, Long userId) {
        LeaveRequest lr = getById(id);
        if (!lr.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only cancel your own leave requests");
        }
        if (lr.getStatus() != LeaveRequest.Status.PENDING && lr.getStatus() != LeaveRequest.Status.APPROVED) {
            throw new BadRequestException("Only pending or approved requests can be cancelled");
        }
        lr.setStatus(LeaveRequest.Status.CANCELLED);
        leaveRequestRepository.save(lr);
    }

    @Transactional(readOnly = true)
    public long countApprovedByUserAndType(Long userId, LeaveRequest.Type type, int year) {
        LocalDate yearStart = LocalDate.of(year, 1, 1);
        LocalDate yearEnd = LocalDate.of(year, 12, 31);
        return leaveRequestRepository.findByUserIdAndStatus(userId, LeaveRequest.Status.APPROVED).stream()
                .filter(lr -> lr.getType() == type)
                .filter(lr -> !lr.getStartDate().isAfter(yearEnd) && !lr.getEndDate().isBefore(yearStart))
                .count();
    }
}