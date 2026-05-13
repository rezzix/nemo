package com.nemo.attachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByTaskId(Long taskId);
    List<Attachment> findByDeliverableId(Long deliverableId);
    List<Attachment> findByDeliverableIdIn(List<Long> deliverableIds);
    void deleteByDeliverableId(Long deliverableId);
}