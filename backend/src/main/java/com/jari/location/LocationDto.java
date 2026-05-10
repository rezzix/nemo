package com.jari.location;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record LocationDto(
        Long id,
        String name,
        String description,
        Long parentId,
        String parentName,
        Long companyId,
        String companyName,
        Integer order,
        boolean active,
        long assetCount,
        List<LocationDto> children,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotBlank String name,
            String description,
            Long parentId,
            Long companyId,
            Integer order
    ) {}

    public record UpdateRequest(
            String name,
            String description,
            Long parentId,
            Integer order,
            Boolean active
    ) {}
}