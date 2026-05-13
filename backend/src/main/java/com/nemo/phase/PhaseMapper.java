package com.nemo.phase;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PhaseMapper {

    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "status", source = "status", qualifiedByName = "phaseStatusToString")
    @Mapping(target = "deliverableCount", ignore = true)
    @Mapping(target = "totalPaid", ignore = true)
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    PhaseDto toDto(Phase phase);

    @Named("phaseStatusToString")
    default String phaseStatusToString(Phase.PhaseStatus status) {
        return status != null ? status.name() : Phase.PhaseStatus.OPEN.name();
    }

    List<PhaseDto> toDtoList(List<Phase> phases);
}