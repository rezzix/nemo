package com.nemo.sprint;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SprintMapper {

    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    SprintDto toDto(Sprint sprint);

    List<SprintDto> toDtoList(List<Sprint> sprints);
}