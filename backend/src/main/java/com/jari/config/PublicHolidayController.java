package com.jari.config;

import com.jari.common.dto.ApiResponse;
import com.jari.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/holidays")
public class PublicHolidayController {

    private final PublicHolidayService holidayService;
    private final AuthHelper authHelper;

    public PublicHolidayController(PublicHolidayService holidayService, AuthHelper authHelper) {
        this.holidayService = holidayService;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PublicHolidayDto>>> list(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        List<PublicHoliday> holidays;
        if (startDate != null && endDate != null) {
            holidays = holidayService.listByDateRange(startDate, endDate, companyId);
        } else if (year != null) {
            holidays = holidayService.listByYear(year, companyId);
        } else {
            holidays = holidayService.listByYear(LocalDate.now().getYear(), companyId);
        }
        List<PublicHolidayDto> dtos = holidays.stream().map(holidayService::toDto).toList();
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PublicHolidayDto>> create(@RequestBody @Valid PublicHolidayDto.CreateRequest request) {
        PublicHoliday holiday = holidayService.create(request);
        return ResponseEntity.ok(ApiResponse.of(holidayService.toDto(holiday)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PublicHolidayDto>> update(@PathVariable Long id,
                                                     @RequestBody @Valid PublicHolidayDto.UpdateRequest request) {
        PublicHoliday holiday = holidayService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(holidayService.toDto(holiday)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        holidayService.delete(id);
        return ResponseEntity.noContent().build();
    }
}