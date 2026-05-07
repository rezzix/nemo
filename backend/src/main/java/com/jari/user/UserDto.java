package com.jari.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserDto(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        String role,
        String avatarUrl,
        boolean active,
        Long companyId,
        String companyName,
        Long assignedProjectId,
        String assignedProjectName,
        String jobTitle,
        String department,
        String phone,
        String hireDate,
        String createdAt,
        String updatedAt
) {

    public record CreateRequest(
            @NotBlank @Size(min = 3, max = 100) String username,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank @Size(min = 1, max = 100) String firstName,
            @NotBlank @Size(min = 1, max = 100) String lastName,
            @NotBlank String role,
            Long companyId,
            Long assignedProjectId,
            String jobTitle,
            String department,
            String phone,
            String hireDate
    ) {}

    public record UpdateRequest(
            @Email String email,
            String firstName,
            String lastName,
            String role,
            Boolean active,
            Long companyId,
            Long assignedProjectId,
            String jobTitle,
            String department,
            String phone,
            String hireDate
    ) {}

    public record PasswordChangeRequest(
            String currentPassword,
            @NotBlank @Size(min = 6) String newPassword
    ) {}
}