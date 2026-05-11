package com.jari.timetracking;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TimeLogMapper {

    @Mapping(target = "issueId", source = "issue.id")
    @Mapping(target = "issueKey", source = "issue.issueKey")
    @Mapping(target = "issueTitle", source = "issue.title")
    @Mapping(target = "presaleId", source = "presale.id")
    @Mapping(target = "presaleName", source = "presale.name")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", expression = "java(timeLog.getUser().getFirstName() + ' ' + timeLog.getUser().getLastName())")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    TimeLogDto toDto(TimeLog timeLog);

    List<TimeLogDto> toDtoList(List<TimeLog> timeLogs);
}