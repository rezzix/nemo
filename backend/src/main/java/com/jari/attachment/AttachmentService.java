package com.jari.attachment;

import com.jari.common.exception.EntityNotFoundException;
import com.jari.common.storage.StorageService;
import com.jari.issue.Issue;
import com.jari.issue.IssueRepository;
import com.jari.phase.Deliverable;
import com.jari.phase.DeliverableRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final IssueRepository issueRepository;
    private final DeliverableRepository deliverableRepository;
    private final StorageService storageService;

    public AttachmentService(AttachmentRepository attachmentRepository,
                              IssueRepository issueRepository,
                              DeliverableRepository deliverableRepository,
                              StorageService storageService) {
        this.attachmentRepository = attachmentRepository;
        this.issueRepository = issueRepository;
        this.deliverableRepository = deliverableRepository;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public List<Attachment> getByIssueId(Long issueId) {
        return attachmentRepository.findByIssueId(issueId);
    }

    @Transactional(readOnly = true)
    public List<Attachment> getByDeliverableId(Long deliverableId) {
        return attachmentRepository.findByDeliverableId(deliverableId);
    }

    @Transactional(readOnly = true)
    public List<Attachment> getByDeliverableIds(List<Long> deliverableIds) {
        return attachmentRepository.findByDeliverableIdIn(deliverableIds);
    }

    @Transactional
    public Attachment upload(Long issueId, MultipartFile file, Long userId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new EntityNotFoundException("Issue", issueId));

        String storedPath;
        try {
            storedPath = storageService.store(file.getBytes(), file.getOriginalFilename(), file.getContentType());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        Attachment attachment = new Attachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFilePath(storedPath);
        attachment.setContentType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setIssue(issue);
        attachment.setUploadedBy(userId);

        return attachmentRepository.save(attachment);
    }

    @Transactional
    public Attachment uploadForDeliverable(Long deliverableId, MultipartFile file, Long userId) {
        Deliverable deliverable = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new EntityNotFoundException("Deliverable", deliverableId));

        String storedPath;
        try {
            storedPath = storageService.store(file.getBytes(), file.getOriginalFilename(), file.getContentType());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        Attachment attachment = new Attachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFilePath(storedPath);
        attachment.setContentType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setDeliverable(deliverable);
        attachment.setUploadedBy(userId);

        return attachmentRepository.save(attachment);
    }

    @Transactional
    public void delete(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", attachmentId));
        storageService.delete(attachment.getFilePath());
        attachmentRepository.delete(attachment);
    }

    @Transactional
    public void deleteByDeliverableId(Long deliverableId) {
        List<Attachment> attachments = attachmentRepository.findByDeliverableId(deliverableId);
        for (Attachment a : attachments) {
            storageService.delete(a.getFilePath());
        }
        attachmentRepository.deleteByDeliverableId(deliverableId);
    }

    @Transactional
    public void deleteByDeliverableIds(List<Long> deliverableIds) {
        List<Attachment> attachments = attachmentRepository.findByDeliverableIdIn(deliverableIds);
        for (Attachment a : attachments) {
            storageService.delete(a.getFilePath());
        }
        attachmentRepository.deleteAll(attachments);
    }

    public Resource download(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", attachmentId));
        return storageService.load(attachment.getFilePath());
    }

    public Attachment getById(Long id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", id));
    }
}