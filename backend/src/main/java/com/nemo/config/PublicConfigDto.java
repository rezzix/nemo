package com.nemo.config;

public record PublicConfigDto(
        OrganizationConfig organization,
        String mode,
        String version,
        String build,
        String currency
) {}