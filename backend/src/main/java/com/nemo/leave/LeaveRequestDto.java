package com.nemo.leave;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record LeaveRequestDto(
        Long id,
        Long userId,
        String userName,
        String type,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        Long approverId,
        String approverName,
        String approverComment,
        String createdAt,
        String updatedAt
) {

    public record CreateRequest(
            @NotNull LeaveRequest.Type type,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            String reason
    ) {}

    public record UpdateRequest(
            LeaveRequest.Type type,
            LocalDate startDate,
            LocalDate endDate,
            String reason
    ) {}

    public record ActionRequest(
            String comment
    ) {}
}