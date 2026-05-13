package com.nemo.program;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProgramMapper {

    @Mapping(target = "managerId", source = "manager.id")
    @Mapping(target = "managerName", source = "manager.firstName")
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "projectCount", ignore = true)
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    ProgramDto toDto(Program program);

    List<ProgramDto> toDtoList(List<Program> programs);
}