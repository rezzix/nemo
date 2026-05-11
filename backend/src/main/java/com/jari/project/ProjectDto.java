package com.jari.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ProjectDto(
        Long id, String name, String key, String description, String instructions,
        Long programId, String programName,
        Long managerId, String managerName,
        Long companyId, String companyName,
        String stage, Integer strategicScore,
        String plannedValue, String budget, String budgetSpent,
        String targetStartDate, String targetEndDate,
        Boolean favorite,
        String createdAt, String updatedAt
) {
    public record CreateRequest(
            @NotBlank @Size(min = 1, max = 255) String name,
            @NotBlank @Size(min = 1, max = 10) String key,
            String description,
            String instructions,
            @NotNull Long programId,
            @NotNull Long managerId,
            List<Long> memberIds,
            String stage,
            Integer strategicScore,
            String plannedValue,
            String budget,
            String targetStartDate,
            String targetEndDate,
            Long companyId
    ) {}

    public record UpdateRequest(
            String name, String description, String instructions, Long managerId,
            String stage, Integer strategicScore,
            String plannedValue, String budget, String budgetSpent,
            String targetStartDate, String targetEndDate
    ) {}

    public record BoardColumnDto(Long id, Long statusId, String name, int position, long issueCount) {}

    public record BoardConfigDto(Long projectId, List<BoardColumnDto> columns) {}

    public record BoardUpdateRequest(List<ColumnEntry> columns) {
        public record ColumnEntry(Long statusId, int position) {}
    }

    public record LabelDto(Long id, String name, String color) {}

    public record LabelCreateRequest(@NotBlank String name, @NotBlank String color) {}

    public record MemberDto(Long id, Long userId, String username, String fullName, Integer score) {}

    public record ScoreRequest(@NotNull Integer score) {}
}