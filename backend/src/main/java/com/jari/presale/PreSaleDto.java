package com.jari.presale;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record PreSaleDto(
        Long id, String name, String key, String description,
        String stage,
        Long clientId, String clientName,
        Long clientContactId, String clientContactName,
        String estimatedValue, Integer probability,
        String expectedCloseDate, String lostReason,
        Long managerId, String managerName,
        Long companyId, String companyName,
        Long programId, String programName,
        Long convertedProjectId, String convertedProjectName,
        String createdAt, String updatedAt
) {
    public record CreateRequest(
            @NotBlank @Size(min = 1, max = 255) String name,
            @NotBlank @Size(min = 1, max = 10) String key,
            String description,
            String stage,
            Long clientId,
            Long clientContactId,
            String estimatedValue,
            Integer probability,
            String expectedCloseDate,
            @NotNull Long managerId,
            Long companyId,
            Long programId
    ) {}

    public record UpdateRequest(
            String name, String description,
            String stage,
            Long clientId, Long clientContactId,
            String estimatedValue, Integer probability,
            String expectedCloseDate, String lostReason,
            Long managerId, Long programId
    ) {}

    public record ConvertRequest(
            @NotBlank @Size(min = 1, max = 255) String projectName,
            @NotBlank @Size(min = 1, max = 10) String projectKey,
            @NotNull Long programId,
            @NotNull Long managerId,
            String description,
            String budget,
            String targetStartDate,
            String targetEndDate
    ) {}

    public record CostSummaryDto(
            BigDecimal totalHours,
            BigDecimal totalCost,
            BigDecimal estimatedValue,
            BigDecimal margin,
            BigDecimal marginPercent,
            List<UserCostEntry> byUser
    ) {}

    public record UserCostEntry(Long userId, String userName, BigDecimal hours, BigDecimal hourlyRate, BigDecimal cost) {}
}