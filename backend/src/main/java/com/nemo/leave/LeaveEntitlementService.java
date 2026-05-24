package com.nemo.leave;

import com.nemo.common.exception.BadRequestException;
import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.config.PublicHoliday;
import com.nemo.config.PublicHolidayRepository;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LeaveEntitlementService {

    private final LeaveEntitlementRepository entitlementRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PublicHolidayRepository publicHolidayRepository;
    private final UserRepository userRepository;

    public LeaveEntitlementService(LeaveEntitlementRepository entitlementRepository,
                                   LeaveRequestRepository leaveRequestRepository,
                                   PublicHolidayRepository publicHolidayRepository,
                                   UserRepository userRepository) {
        this.entitlementRepository = entitlementRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.publicHolidayRepository = publicHolidayRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<LeaveBalanceDto> getBalances(Long userId, int year) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        List<LeaveEntitlement> entitlements = entitlementRepository.findByUserIdAndYear(userId, year);
        Long companyId = user.getCompany() != null ? user.getCompany().getId() : null;

        List<LeaveBalanceDto> balances = new ArrayList<>();
        for (LeaveRequest.Type type : LeaveRequest.Type.values()) {
            int totalAllocated = entitlements.stream()
                    .filter(e -> e.getType() == type)
                    .mapToInt(LeaveEntitlement::getTotalDays)
                    .findFirst()
                    .orElse(0);
            int usedDays = calculateUsedDays(userId, type, year);
            int remainingDays = totalAllocated - usedDays;
            balances.add(new LeaveBalanceDto(
                    userId,
                    user.getFirstName() + " " + user.getLastName(),
                    type.name(),
                    year,
                    totalAllocated,
                    usedDays,
                    remainingDays
            ));
        }
        return balances;
    }

    @Transactional(readOnly = true)
    public int calculateUsedDays(Long userId, LeaveRequest.Type type, int year) {
        LocalDate yearStart = LocalDate.of(year, 1, 1);
        LocalDate yearEnd = LocalDate.of(year, 12, 31);

        List<LeaveRequest> approved = leaveRequestRepository.findApprovedByUserAndTypeInYear(
                userId, type, yearStart, yearEnd);

        int totalDays = 0;
        for (LeaveRequest lr : approved) {
            LocalDate start = lr.getStartDate().isBefore(yearStart) ? yearStart : lr.getStartDate();
            LocalDate end = lr.getEndDate().isAfter(yearEnd) ? yearEnd : lr.getEndDate();
            totalDays += (int) ChronoUnit.DAYS.between(start, end) + 1;
        }
        return totalDays;
    }

    @Transactional(readOnly = true)
    public WorkingDaysResult calculateWorkingDays(LocalDate startDate, LocalDate endDate, Long companyId) {
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Start date must be before or equal to end date");
        }

        int calendarDays = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
        int workingDays = 0;
        Set<LocalDate> holidays = Set.of();

        if (companyId != null) {
            List<PublicHoliday> holidaysList = publicHolidayRepository
                    .findByDateBetweenAndCompanyOrGlobal(startDate, endDate, companyId);
            holidays = holidaysList.stream()
                    .map(PublicHoliday::getDate)
                    .collect(Collectors.toSet());
        } else {
            List<PublicHoliday> holidaysList = publicHolidayRepository
                    .findGlobalByDateBetween(startDate, endDate);
            holidays = holidaysList.stream()
                    .map(PublicHoliday::getDate)
                    .collect(Collectors.toSet());
        }

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DayOfWeek dow = date.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY && !holidays.contains(date)) {
                workingDays++;
            }
        }

        return new WorkingDaysResult(workingDays, calendarDays);
    }

    @Transactional(readOnly = true)
    public List<LeaveEntitlement> listEntitlements(Long userId, Integer year) {
        if (userId != null && year != null) {
            return entitlementRepository.findByUserIdAndYear(userId, year);
        }
        if (userId != null) {
            return entitlementRepository.findByUserId(userId);
        }
        if (year != null) {
            return entitlementRepository.findByYear(year);
        }
        return entitlementRepository.findAll();
    }

    @Transactional
    public LeaveEntitlement create(LeaveEntitlementDto.CreateRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.userId()));

        entitlementRepository.findByUserIdAndTypeAndYear(request.userId(), request.type(), request.year())
                .ifPresent(existing -> {
                    throw new BadRequestException("Entitlement already exists for this user/type/year");
                });

        LeaveEntitlement entitlement = new LeaveEntitlement();
        entitlement.setUser(user);
        entitlement.setType(request.type());
        entitlement.setYear(request.year());
        entitlement.setTotalDays(request.totalDays());
        return entitlementRepository.save(entitlement);
    }

    @Transactional
    public LeaveEntitlement update(Long id, LeaveEntitlementDto.UpdateRequest request) {
        LeaveEntitlement entitlement = entitlementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LeaveEntitlement", id));

        if (request.totalDays() != null) {
            entitlement.setTotalDays(request.totalDays());
        }
        return entitlementRepository.save(entitlement);
    }

    public record WorkingDaysResult(int workingDays, int calendarDays) {}
}