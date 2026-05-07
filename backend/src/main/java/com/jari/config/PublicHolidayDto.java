package com.jari.config;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PublicHolidayDto(Long id, LocalDate date, String name, Long companyId, String companyName) {

    public record CreateRequest(@NotNull LocalDate date, @NotNull String name, Long companyId) {}

    public record UpdateRequest(LocalDate date, String name, Long companyId) {}
}