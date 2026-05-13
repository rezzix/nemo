package com.nemo.attachment;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.common.storage.StorageService;
import com.nemo.task.Task;
import com.nemo.task.TaskRepository;
import com.nemo.phase.Deliverable;
import com.nemo.phase.DeliverableRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final DeliverableRepository deliverableRepository;
    private final StorageService storageService;

    public AttachmentService(AttachmentRepository attachmentRepository,
                              TaskRepository taskRepository,
                              DeliverableRepository deliverableRepository,
                              StorageService storageService) {
        this.attachmentRepository = attachmentRepository;
        this.taskRepository = taskRepository;
        this.deliverableRepository = deliverableRepository;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public List<Attachment> getByTaskId(Long taskId) {
        return attachmentRepository.findByTaskId(taskId);
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
    public Attachment upload(Long taskId, MultipartFile file, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task", taskId));

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
        attachment.setTask(task);
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