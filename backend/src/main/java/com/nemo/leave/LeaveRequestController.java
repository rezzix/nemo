package com.nemo.leave;

import com.nemo.common.dto.ApiResponse;
import com.nemo.common.exception.ForbiddenException;
import com.nemo.security.AuthHelper;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leave-requests")
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;
    private final LeaveRequestMapper leaveRequestMapper;
    private final LeaveEntitlementService entitlementService;
    private final LeaveEntitlementMapper entitlementMapper;
    private final AuthHelper authHelper;
    private final UserRepository userRepository;

    public LeaveRequestController(LeaveRequestService leaveRequestService, LeaveRequestMapper leaveRequestMapper,
                                   LeaveEntitlementService entitlementService, LeaveEntitlementMapper entitlementMapper,
                                   AuthHelper authHelper, UserRepository userRepository) {
        this.leaveRequestService = leaveRequestService;
        this.leaveRequestMapper = leaveRequestMapper;
        this.entitlementService = entitlementService;
        this.entitlementMapper = entitlementMapper;
        this.authHelper = authHelper;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<LeaveRequestDto>>> list(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) LeaveRequest.Status status,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserDetails currentUser) {

        boolean canSeeAll = authHelper.hasAnyRole(currentUser, "ADMIN", "MANAGER", "EXECUTIVE", "HR");
        Long currentUserId = authHelper.getCurrentUserId(currentUser);

        if (canSeeAll) {
            // Managers see only their company; global users (ADMIN/HR/EXECUTIVE/global managers) see all
            Long effectiveCompanyId = authHelper.getCurrentCompanyId(currentUser);
            if (effectiveCompanyId != null && !authHelper.hasAnyRole(currentUser, "ADMIN", "HR", "EXECUTIVE")) {
                // Company-scoped manager: filter to own company
                companyId = effectiveCompanyId;
            }
            Long effectiveUserId = userId; // no restriction on which user
            List<LeaveRequest> results = leaveRequestService.list(effectiveUserId, status, companyId, startDate, endDate);
            return ResponseEntity.ok(ApiResponse.of(leaveRequestMapper.toDtoList(results)));
        }

        // Regular users see only their own requests
        List<LeaveRequest> results = leaveRequestService.list(currentUserId, status, null, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.of(leaveRequestMapper.toDtoList(results)));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE', 'HR')")
    public ResponseEntity<ApiResponse<List<LeaveRequestDto>>> listPending(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        // Company-scoped managers only see pending from their company; global users see all
        if (companyId != null && !authHelper.hasAnyRole(currentUser, "ADMIN", "HR", "EXECUTIVE")) {
            List<LeaveRequest> results = leaveRequestService.listByCompanyAndStatus(companyId, LeaveRequest.Status.PENDING);
            return ResponseEntity.ok(ApiResponse.of(leaveRequestMapper.toDtoList(results)));
        }
        List<LeaveRequest> results = leaveRequestService.listPending();
        return ResponseEntity.ok(ApiResponse.of(leaveRequestMapper.toDtoList(results)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        LeaveRequest lr = leaveRequestService.getById(id);
        Long currentUserId = authHelper.getCurrentUserId(currentUser);

        boolean canSeeAll = authHelper.hasAnyRole(currentUser, "ADMIN", "MANAGER", "EXECUTIVE", "HR");
        if (!canSeeAll && !lr.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only view your own leave requests");
        }

        // Company-scoped managers can only see requests from their own company
        if (canSeeAll && !authHelper.hasAnyRole(currentUser, "ADMIN", "HR", "EXECUTIVE")) {
            Long companyId = authHelper.getCurrentCompanyId(currentUser);
            if (companyId != null) {
                Long requesterCompanyId = lr.getUser().getCompany() != null ? lr.getUser().getCompany().getId() : null;
                if (!companyId.equals(requesterCompanyId)) {
                    throw new ForbiddenException("You can only view leave requests from your company");
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.of(leaveRequestMapper.toDto(lr)));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> create(
            @RequestBody LeaveRequestDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        LeaveRequest created = leaveRequestService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(leaveRequestMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> update(
            @PathVariable Long id,
            @RequestBody LeaveRequestDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        LeaveRequest updated = leaveRequestService.update(id, userId, request);
        return ResponseEntity.ok(ApiResponse.of(leaveRequestMapper.toDto(updated)));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) LeaveRequestDto.ActionRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long approverId = authHelper.getCurrentUserId(currentUser);
        // Company-scoped managers can only approve requests from their own company
        checkCompanyAccess(id, currentUser);
        LeaveRequest approved = leaveRequestService.approve(id, approverId, request != null ? request.comment() : null);
        return ResponseEntity.ok(ApiResponse.of(leaveRequestMapper.toDto(approved)));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) LeaveRequestDto.ActionRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long approverId = authHelper.getCurrentUserId(currentUser);
        checkCompanyAccess(id, currentUser);
        LeaveRequest rejected = leaveRequestService.reject(id, approverId, request != null ? request.comment() : null);
        return ResponseEntity.ok(ApiResponse.of(leaveRequestMapper.toDto(rejected)));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        leaveRequestService.cancel(id, userId);
        LeaveRequest lr = leaveRequestService.getById(id);
        return ResponseEntity.ok(ApiResponse.of(leaveRequestMapper.toDto(lr)));
    }

    // --- Balance endpoints ---

    @GetMapping("/balances")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDto>>> getBalances(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer year,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long currentUserId = authHelper.getCurrentUserId(currentUser);
        boolean canSeeAll = authHelper.hasAnyRole(currentUser, "ADMIN", "MANAGER", "EXECUTIVE", "HR");

        Long targetUserId = userId != null ? userId : currentUserId;
        if (!canSeeAll && !targetUserId.equals(currentUserId)) {
            throw new ForbiddenException("You can only view your own leave balances");
        }

        int targetYear = year != null ? year : LocalDate.now().getYear();
        List<LeaveBalanceDto> balances = entitlementService.getBalances(targetUserId, targetYear);
        return ResponseEntity.ok(ApiResponse.of(balances));
    }

    @GetMapping("/working-days")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaveEntitlementService.WorkingDaysResult>> getWorkingDays(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long companyId,
            @AuthenticationPrincipal UserDetails currentUser) {
        if (companyId == null) {
            Long currentUserId = authHelper.getCurrentUserId(currentUser);
            User user = userRepository.findById(currentUserId).orElse(null);
            companyId = user != null && user.getCompany() != null ? user.getCompany().getId() : null;
        }
        LeaveEntitlementService.WorkingDaysResult result = entitlementService.calculateWorkingDays(startDate, endDate, companyId);
        return ResponseEntity.ok(ApiResponse.of(result));
    }

    // --- Entitlement management endpoints (HR only) ---

    @GetMapping("/entitlements")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<List<LeaveEntitlementDto>>> listEntitlements(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer year) {
        List<LeaveEntitlement> entitlements = entitlementService.listEntitlements(userId, year);
        return ResponseEntity.ok(ApiResponse.of(entitlementMapper.toDtoList(entitlements)));
    }

    @PostMapping("/entitlements")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<LeaveEntitlementDto>> createEntitlement(
            @Valid @RequestBody LeaveEntitlementDto.CreateRequest request) {
        LeaveEntitlement created = entitlementService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(entitlementMapper.toDto(created)));
    }

    @PutMapping("/entitlements/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<LeaveEntitlementDto>> updateEntitlement(
            @PathVariable Long id,
            @Valid @RequestBody LeaveEntitlementDto.UpdateRequest request) {
        LeaveEntitlement updated = entitlementService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(entitlementMapper.toDto(updated)));
    }

    private void checkCompanyAccess(Long leaveRequestId, UserDetails currentUser) {
        // ADMIN and HR (global) can approve any request
        if (authHelper.hasAnyRole(currentUser, "ADMIN", "HR")) return;

        // Company-scoped managers can only approve requests from their own company
        LeaveRequest lr = leaveRequestService.getById(leaveRequestId);
        Long managerCompanyId = authHelper.getCurrentCompanyId(currentUser);
        if (managerCompanyId != null) {
            Long requesterCompanyId = lr.getUser().getCompany() != null ? lr.getUser().getCompany().getId() : null;
            if (!managerCompanyId.equals(requesterCompanyId)) {
                throw new ForbiddenException("You can only approve leave requests from your company");
            }
        }
        // Global managers (companyId=null) can approve any request
    }
}