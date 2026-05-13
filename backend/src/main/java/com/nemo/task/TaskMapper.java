package com.nemo.task;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "statusId", source = "status.id")
    @Mapping(target = "statusName", source = "status.name")
    @Mapping(target = "statusCategory", source = "status.category")
    @Mapping(target = "typeId", source = "type.id")
    @Mapping(target = "typeName", source = "type.name")
    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "projectKey", source = "project.key")
    @Mapping(target = "assigneeId", source = "assignee.id")
    @Mapping(target = "assigneeName", expression = "java(task.getAssignee() != null ? task.getAssignee().getFirstName() + ' ' + task.getAssignee().getLastName() : null)")
    @Mapping(target = "reporterId", source = "reporter.id")
    @Mapping(target = "reporterName", expression = "java(task.getReporter().getFirstName() + ' ' + task.getReporter().getLastName())")
    @Mapping(target = "sprintId", source = "sprint.id")
    @Mapping(target = "phaseId", source = "phase.id")
    @Mapping(target = "phaseName", source = "phase.name")
    @Mapping(target = "labelIds", expression = "java(task.getLabels().stream().map(l -> l.getId()).toList())")
    @Mapping(target = "labelNames", expression = "java(task.getLabels().stream().map(l -> l.getName()).toList())")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    TaskDto toDto(Task task);

    List<TaskDto> toDtoList(List<Task> tasks);

    @Mapping(target = "authorId", source = "author.id")
    @Mapping(target = "authorName", expression = "java(comment.getAuthor().getFirstName() + ' ' + comment.getAuthor().getLastName())")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    TaskDto.CommentDto toCommentDto(Comment comment);

    List<TaskDto.CommentDto> toCommentDtoList(List<Comment> comments);
}