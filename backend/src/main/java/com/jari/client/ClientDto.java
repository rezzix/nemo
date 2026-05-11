package com.jari.client;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ClientDto(
        Long id, String name, String industry, String website, String notes,
        Long companyId, String companyName,
        List<ContactDto> contacts,
        String createdAt, String updatedAt
) {
    public record CreateRequest(
            @NotBlank @Size(min = 1, max = 255) String name,
            String industry,
            String website,
            String notes,
            Long companyId,
            List<ContactCreateRequest> contacts
    ) {}

    public record UpdateRequest(
            String name, String industry, String website, String notes, Long companyId
    ) {}

    public record ContactDto(Long id, String name, String email, String phone, String role) {}

    public record ContactCreateRequest(
            @NotBlank String name, String email, String phone, String role
    ) {}

    public record ContactUpdateRequest(
            String name, String email, String phone, String role
    ) {}
}