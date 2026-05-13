package com.nemo.phase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record DeliverableDto(
        Long id,
        String name,
        String description,
        Long phaseId,
        String phaseName,
        String state,
        String dueDate,
        List<AttachmentSummaryDto> attachments,
        String createdAt,
        String updatedAt
) {
    public record AttachmentSummaryDto(Long id, String fileName, String contentType, long fileSize, String createdAt) {}

    public record CreateRequest(
            @NotBlank String name,
            String description,
            @NotNull Long phaseId,
            String dueDate
    ) {}

    public record UpdateRequest(
            String name,
            String description,
            String state,
            String dueDate
    ) {}
}