package com.jari.project;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProjectMapper {

    @Mapping(target = "programId", source = "program.id")
    @Mapping(target = "programName", source = "program.name")
    @Mapping(target = "managerId", source = "manager.id")
    @Mapping(target = "managerName", source = "manager.firstName")
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "stage", source = "stage")
    @Mapping(target = "strategicScore", source = "strategicScore")
    @Mapping(target = "plannedValue", source = "plannedValue")
    @Mapping(target = "budget", source = "budget")
    @Mapping(target = "budgetSpent", source = "budgetSpent")
    @Mapping(target = "targetStartDate", source = "targetStartDate", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "targetEndDate", source = "targetEndDate", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "favorite", ignore = true)
    ProjectDto toDto(Project project);

    List<ProjectDto> toDtoList(List<Project> projects);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "fullName", expression = "java(pm.getUser().getFirstName() + ' ' + pm.getUser().getLastName())")
    @Mapping(target = "score", source = "score")
    ProjectDto.MemberDto toMemberDto(ProjectMember pm);
}