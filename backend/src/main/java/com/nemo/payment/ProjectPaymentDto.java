package com.nemo.payment;

import java.math.BigDecimal;

public class ProjectPaymentDto {

    public record Response(
            Long id, Long projectId, String projectName,
            String title, BigDecimal amount, String currency,
            String dueDate, String receivedDate, String status,
            String invoiceRef, String notes,
            Long createdById, String createdByName,
            String createdAt, String updatedAt
    ) {}

    public record CreateRequest(
            String title, BigDecimal amount, String currency,
            String dueDate, String invoiceRef, String notes
    ) {}

    public record UpdateRequest(
            String title, BigDecimal amount, String currency,
            String dueDate, String invoiceRef, String notes
    ) {}
}