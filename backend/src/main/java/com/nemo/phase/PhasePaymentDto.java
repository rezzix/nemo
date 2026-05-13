package com.nemo.phase;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record PhasePaymentDto(
        Long id,
        Long phaseId,
        String amount,
        String paymentDate,
        String reference,
        String notes,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotNull @DecimalMin("0.01") String amount,
            String paymentDate,
            String reference,
            String notes
    ) {}

    public record UpdateRequest(
            String amount,
            String paymentDate,
            String reference,
            String notes
    ) {}
}