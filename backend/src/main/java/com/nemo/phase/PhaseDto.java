package com.nemo.phase;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record PhaseDto(
        Long id,
        String name,
        String description,
        Long projectId,
        LocalDate startDate,
        LocalDate endDate,
        int position,
        String status,
        long deliverableCount,
        String plannedAmount,
        String totalPaid,
        String spent,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotBlank String name,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            @NotBlank String plannedAmount,
            String status
    ) {}

    public record UpdateRequest(
            String name,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            Integer position,
            @NotBlank String plannedAmount,
            String status
    ) {}
}