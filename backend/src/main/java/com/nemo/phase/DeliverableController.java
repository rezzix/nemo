package com.nemo.phase;

import com.nemo.attachment.Attachment;
import com.nemo.attachment.AttachmentService;
import com.nemo.common.dto.ApiResponse;
import com.nemo.security.AuthHelper;
import jakarta.validation.Valid;
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
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects/{projectId}/deliverables")
public class DeliverableController {

    private final DeliverableService deliverableService;
    private final DeliverableMapper deliverableMapper;
    private final AttachmentService attachmentService;
    private final AuthHelper authHelper;

    public DeliverableController(DeliverableService deliverableService,
                                  DeliverableMapper deliverableMapper,
                                  AttachmentService attachmentService,
                                  AuthHelper authHelper) {
        this.deliverableService = deliverableService;
        this.deliverableMapper = deliverableMapper;
        this.attachmentService = attachmentService;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeliverableDto>>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long phaseId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        List<Deliverable> deliverables = phaseId != null
                ? deliverableService.getByPhaseId(phaseId)
                : deliverableService.getByProjectId(projectId);
        List<DeliverableDto> dtos = deliverableMapper.toDtoList(deliverables);

        // Batch enrich with attachments
        List<Long> deliverableIds = deliverables.stream().map(Deliverable::getId).toList();
        if (!deliverableIds.isEmpty()) {
            Map<Long, List<Attachment>> attsById = attachmentService.getByDeliverableIds(deliverableIds).stream()
                    .collect(Collectors.groupingBy(a -> a.getDeliverable().getId()));
            dtos = dtos.stream().map(dto -> {
                List<Attachment> atts = attsById.getOrDefault(dto.id(), List.of());
                return enrichDto(dto, atts);
            }).toList();
        }
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliverableDto>> get(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        DeliverableDto dto = deliverableMapper.toDto(deliverableService.getById(id));
        List<Attachment> atts = attachmentService.getByDeliverableId(id);
        return ResponseEntity.ok(ApiResponse.of(enrichDto(dto, atts)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<DeliverableDto>> create(
            @PathVariable Long projectId,
            @Valid @RequestBody DeliverableDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Deliverable created = deliverableService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(deliverableMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<DeliverableDto>> update(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestBody DeliverableDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Deliverable updated = deliverableService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(deliverableMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        deliverableService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Attachment endpoints

    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<DeliverableDto.AttachmentSummaryDto>>> listAttachments(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        List<Attachment> attachments = attachmentService.getByDeliverableId(id);
        return ResponseEntity.ok(ApiResponse.of(toAttachmentDtos(attachments)));
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<DeliverableDto.AttachmentSummaryDto>> uploadAttachment(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        Long userId = authHelper.getCurrentUserId(currentUser);
        Attachment attachment = attachmentService.uploadForDeliverable(id, file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(
                new DeliverableDto.AttachmentSummaryDto(
                        attachment.getId(), attachment.getFileName(),
                        attachment.getContentType(), attachment.getFileSize(),
                        attachment.getCreatedAt().toString())
        ));
    }

    @DeleteMapping("/{deliverableId}/attachments/{attachmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable Long projectId,
            @PathVariable Long deliverableId,
            @PathVariable Long attachmentId) {
        attachmentService.delete(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{deliverableId}/attachments/download/{attachmentId}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
            @PathVariable Long projectId,
            @PathVariable Long deliverableId,
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        Attachment attachment = attachmentService.getById(attachmentId);
        org.springframework.core.io.Resource resource = attachmentService.download(attachmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }

    private DeliverableDto enrichDto(DeliverableDto dto, List<Attachment> atts) {
        return new DeliverableDto(dto.id(), dto.name(), dto.description(),
                dto.phaseId(), dto.phaseName(), dto.state(), dto.dueDate(),
                toAttachmentDtos(atts), dto.createdAt(), dto.updatedAt());
    }

    private List<DeliverableDto.AttachmentSummaryDto> toAttachmentDtos(List<Attachment> attachments) {
        return attachments.stream()
                .map(a -> new DeliverableDto.AttachmentSummaryDto(
                        a.getId(), a.getFileName(), a.getContentType(),
                        a.getFileSize(), a.getCreatedAt().toString()))
                .toList();
    }
}