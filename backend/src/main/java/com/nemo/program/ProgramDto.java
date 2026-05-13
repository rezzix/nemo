package com.nemo.program;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProgramDto(
        Long id, String name, String key, String description,
        Long managerId, String managerName,
        Long companyId, String companyName,
        Long projectCount,
        String createdAt, String updatedAt
) {
    public record CreateRequest(
            @NotBlank @Size(min = 1, max = 255) String name,
            @NotBlank @Size(min = 1, max = 10) String key,
            String description,
            @NotNull Long managerId,
            Long companyId
    ) {}

    public record UpdateRequest(
            String name, String description, Long managerId
    ) {}
}