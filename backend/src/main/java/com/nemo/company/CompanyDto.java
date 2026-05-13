package com.nemo.company;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyDto(
        Long id,
        String name,
        String key,
        String description,
        String address,
        String website,
        String logo,
        Integer order,
        boolean active,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotBlank @Size(min = 1, max = 255) String name,
            @NotBlank @Size(min = 1, max = 10) String key,
            String description,
            String address,
            String website,
            String logo,
            Integer order
    ) {}

    public record UpdateRequest(
            String name,
            String description,
            String address,
            String website,
            String logo,
            Integer order,
            Boolean active
    ) {}
}