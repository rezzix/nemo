package com.nemo.leave;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record LeaveEntitlementDto(
        Long id,
        Long userId,
        String userName,
        String type,
        int year,
        int totalDays,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotNull Long userId,
            @NotNull LeaveRequest.Type type,
            @NotNull Integer year,
            @NotNull @Min(0) Integer totalDays
    ) {}

    public record UpdateRequest(
            @Min(0) Integer totalDays
    ) {}
}