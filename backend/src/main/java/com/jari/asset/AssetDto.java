package com.jari.asset;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetDto(
        Long id,
        String name,
        String description,
        String type,
        String identifier,
        String status,
        Long locationId,
        String locationName,
        Long userId,
        String userName,
        Long companyId,
        String companyName,
        LocalDate purchaseDate,
        BigDecimal purchaseCost,
        String notes,
        boolean active,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotBlank String name,
            String description,
            @NotBlank String type,
            String identifier,
            String status,
            Long locationId,
            Long userId,
            Long companyId,
            String purchaseDate,
            BigDecimal purchaseCost,
            String notes
    ) {}

    public record UpdateRequest(
            String name,
            String description,
            String type,
            String identifier,
            String status,
            Long locationId,
            Long companyId,
            String purchaseDate,
            BigDecimal purchaseCost,
            String notes
    ) {}

    public record AssignRequest(
            @NotNull Long userId
    ) {}
}