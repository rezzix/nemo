package com.nemo.user;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "assignedProjectId", source = "assignedProject.id")
    @Mapping(target = "assignedProjectName", source = "assignedProject.name")
    @Mapping(target = "hireDate", source = "hireDate", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    UserDto toDto(User user);

    List<UserDto> toDtoList(List<User> users);

    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "assignedProject", ignore = true)
    User toEntity(UserDto.CreateRequest request);
}