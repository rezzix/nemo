package com.nemo.documentation;

import com.nemo.common.dto.ApiResponse;
import com.nemo.task.Task;
import com.nemo.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/wiki")
public class WikiPageController {

    private final WikiPageService wikiPageService;
    private final AuthHelper authHelper;

    public WikiPageController(WikiPageService wikiPageService, AuthHelper authHelper) {
        this.wikiPageService = wikiPageService;
        this.authHelper = authHelper;
    }

    @GetMapping("/pages")
    public ResponseEntity<ApiResponse<List<WikiPageDto.TreeItem>>> getPageTree(
            @PathVariable Long projectId, @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        List<WikiPage> rootPages = wikiPageService.getPageTree(projectId);
        List<WikiPageDto.TreeItem> tree = rootPages.stream().map(p -> toTreeItem(p)).toList();
        return ResponseEntity.ok(ApiResponse.of(tree));
    }

    @GetMapping("/pages/{pageId}")
    public ResponseEntity<ApiResponse<WikiPageDto>> getPage(
            @PathVariable Long projectId, @PathVariable Long pageId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        WikiPage page = wikiPageService.getById(pageId);
        return ResponseEntity.ok(ApiResponse.of(toDto(page)));
    }

    @PostMapping("/pages")
    public ResponseEntity<ApiResponse<WikiPageDto>> createPage(
            @PathVariable Long projectId,
            @Valid @RequestBody WikiPageDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        Long userId = authHelper.getCurrentUserId(currentUser);
        WikiPage created = wikiPageService.create(projectId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(toDto(created)));
    }

    @PutMapping("/pages/{pageId}")
    public ResponseEntity<ApiResponse<WikiPageDto>> updatePage(
            @PathVariable Long projectId, @PathVariable Long pageId,
            @RequestBody WikiPageDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        WikiPage updated = wikiPageService.update(pageId, request);
        return ResponseEntity.ok(ApiResponse.of(toDto(updated)));
    }

    @DeleteMapping("/pages/{pageId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deletePage(@PathVariable Long projectId, @PathVariable Long pageId) {
        wikiPageService.delete(pageId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/pages/{pageId}/position")
    public ResponseEntity<ApiResponse<WikiPageDto>> updatePosition(
            @PathVariable Long projectId, @PathVariable Long pageId,
            @RequestBody WikiPageDto.PositionRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        WikiPage updated = wikiPageService.updatePosition(pageId, request);
        return ResponseEntity.ok(ApiResponse.of(toDto(updated)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<WikiPageDto.SearchHit>>> search(
            @PathVariable Long projectId, @RequestParam String q,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        List<WikiPageDto.SearchHit> hits = wikiPageService.search(projectId, q).stream()
                .map(p -> new WikiPageDto.SearchHit(p.getId(), p.getTitle(), p.getSlug()))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(hits));
    }

    private WikiPageDto toDto(WikiPage page) {
        return new WikiPageDto(
                page.getId(), page.getTitle(), page.getSlug(), page.getContent(),
                page.getProject().getId(),
                page.getParent() != null ? page.getParent().getId() : null,
                page.getPosition(),
                page.getAuthor().getId(),
                page.getAuthor().getFirstName() + " " + page.getAuthor().getLastName(),
                page.getLinkedTasks().stream().map(Task::getId).toList(),
                page.getUpdatedAt().toString(),
                null
        );
    }

    private WikiPageDto.TreeItem toTreeItem(WikiPage page) {
        List<WikiPage> children = wikiPageService.getChildren(page.getId());
        return new WikiPageDto.TreeItem(
                page.getId(), page.getTitle(), page.getSlug(),
                page.getParent() != null ? page.getParent().getId() : null,
                page.getPosition(),
                children.stream().map(this::toTreeItem).toList()
        );
    }
}