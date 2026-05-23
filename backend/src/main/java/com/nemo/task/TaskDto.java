package com.nemo.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record TaskDto(
        Long id, String title, String description, String taskKey,
        Long statusId, String statusName, String statusCategory, String priority,
        Long typeId, String typeName,
        Long projectId, String projectKey,
        Long assigneeId, String assigneeName,
        Long reporterId, String reporterName,
        Long sprintId, Long phaseId, String phaseName, int position, boolean external,
        List<Long> labelIds, List<String> labelNames,
        String dueDate,
        String createdAt, String updatedAt
) {
    public record CreateRequest(
            @NotBlank @Size(min = 1, max = 500) String title,
            String description,
            @NotBlank String priority,
            @NotNull Long typeId,
            Long assigneeId,
            Long phaseId,
            List<Long> labelIds,
            Boolean external,
            String dueDate
    ) {}

    public record UpdateRequest(
            String title, String description, String priority,
            Long typeId, Long assigneeId, Long statusId, Long sprintId, Long phaseId,
            List<Long> labelIds, Boolean external,
            String dueDate
    ) {}

    public record PositionRequest(int position, Long sprintId) {}

    public record CommentDto(Long id, String content, Long authorId, String authorName, String createdAt, String updatedAt) {
        public record CreateRequest(@NotBlank String content) {}
        public record UpdateRequest(@NotBlank String content) {}
    }

    public record AttachmentDto(Long id, String fileName, String contentType, long fileSize, Long uploadedBy, String createdAt) {}
}