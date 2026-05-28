package com.nemo.pmo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RaidItemDto(
        Long id,
        Long projectId,
        String projectName,
        RaidItem.RaidType type,
        String title,
        String description,
        RaidItem.RaidStatus status,
        Integer probability,
        Integer impact,
        int riskScore,
        String mitigationPlan,
        Long dependsOnProjectId,
        Long ownerId,
        String ownerName,
        String dueDate,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotNull RaidItem.RaidType type,
            @NotBlank String title,
            String description,
            RaidItem.RaidStatus status,
            Integer probability,
            Integer impact,
            String mitigationPlan,
            Long dependsOnProjectId,
            Long ownerId,
            String dueDate
    ) {}

    public record UpdateRequest(
            RaidItem.RaidType type,
            String title,
            String description,
            RaidItem.RaidStatus status,
            Integer probability,
            Integer impact,
            String mitigationPlan,
            Long dependsOnProjectId,
            Long ownerId,
            String dueDate
    ) {}
}