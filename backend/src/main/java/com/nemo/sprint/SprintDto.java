package com.nemo.sprint;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record SprintDto(
        Long id, String name, String goal, Long projectId,
        String status, LocalDate startDate, LocalDate endDate,
        String createdAt, String updatedAt
) {
    public record CreateRequest(
            @NotBlank String name, String goal,
            LocalDate startDate, LocalDate endDate
    ) {}

    public record UpdateRequest(String name, String goal, LocalDate startDate, LocalDate endDate) {}

    public record StatusUpdateRequest(@NotBlank String status) {}
}