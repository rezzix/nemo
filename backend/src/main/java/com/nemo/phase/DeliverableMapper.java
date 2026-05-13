package com.nemo.phase;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DeliverableMapper {

    @Mapping(target = "phaseId", source = "phase.id")
    @Mapping(target = "phaseName", source = "phase.name")
    @Mapping(target = "dueDate", source = "dueDate", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "attachments", expression = "java(java.util.Collections.emptyList())")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    DeliverableDto toDto(Deliverable deliverable);

    List<DeliverableDto> toDtoList(List<Deliverable> deliverables);
}