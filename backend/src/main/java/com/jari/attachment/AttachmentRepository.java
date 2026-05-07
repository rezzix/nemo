package com.jari.attachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByIssueId(Long issueId);
    List<Attachment> findByDeliverableId(Long deliverableId);
    List<Attachment> findByDeliverableIdIn(List<Long> deliverableIds);
    void deleteByDeliverableId(Long deliverableId);
}