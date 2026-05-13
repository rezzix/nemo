package com.nemo.documentation;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record WikiPageDto(
        Long id, String title, String slug, String content,
        Long projectId, Long parentId, int position,
        Long authorId, String authorName,
        List<Long> linkedTaskIds,
        String updatedAt,
        List<WikiPageDto> children
) {
    public record CreateRequest(
            @NotBlank String title,
            String content,
            Long parentId,
            List<Long> linkedTaskIds
    ) {}

    public record UpdateRequest(
            String title, String content, Long parentId,
            List<Long> linkedTaskIds
    ) {}

    public record PositionRequest(Long parentId, int position) {}

    public record TreeItem(Long id, String title, String slug, Long parentId, int position, List<TreeItem> children) {}

    public record SearchHit(Long id, String title, String slug) {}
}