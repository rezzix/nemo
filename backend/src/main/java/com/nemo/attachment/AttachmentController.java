package com.nemo.attachment;

import com.nemo.common.dto.ApiResponse;
import com.nemo.task.TaskDto;
import com.nemo.security.AuthHelper;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks/{taskId}/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final AuthHelper authHelper;

    public AttachmentController(AttachmentService attachmentService, AuthHelper authHelper) {
        this.attachmentService = attachmentService;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskDto.AttachmentDto>>> list(
            @PathVariable Long projectId, @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        List<TaskDto.AttachmentDto> attachments = attachmentService.getByTaskId(taskId).stream()
                .map(a -> new TaskDto.AttachmentDto(a.getId(), a.getFileName(), a.getContentType(),
                        a.getFileSize(), a.getUploadedBy(), a.getCreatedAt().toString()))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(attachments));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskDto.AttachmentDto>> upload(
            @PathVariable Long projectId, @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        Long userId = authHelper.getCurrentUserId(currentUser);
        Attachment attachment = attachmentService.upload(taskId, file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(
                new TaskDto.AttachmentDto(attachment.getId(), attachment.getFileName(),
                        attachment.getContentType(), attachment.getFileSize(),
                        attachment.getUploadedBy(), attachment.getCreatedAt().toString())
        ));
    }

    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long projectId, @PathVariable Long attachmentId) {
        attachmentService.delete(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/download/{attachmentId}")
    public ResponseEntity<Resource> download(
            @PathVariable Long projectId, @PathVariable Long attachmentId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        Resource resource = attachmentService.download(attachmentId);
        Attachment attachment = attachmentService.getById(attachmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }
}