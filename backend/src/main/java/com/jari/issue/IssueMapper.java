package com.jari.issue;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IssueMapper {

    @Mapping(target = "statusId", source = "status.id")
    @Mapping(target = "statusName", source = "status.name")
    @Mapping(target = "statusCategory", source = "status.category")
    @Mapping(target = "typeId", source = "type.id")
    @Mapping(target = "typeName", source = "type.name")
    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "projectKey", source = "project.key")
    @Mapping(target = "assigneeId", source = "assignee.id")
    @Mapping(target = "assigneeName", expression = "java(issue.getAssignee() != null ? issue.getAssignee().getFirstName() + ' ' + issue.getAssignee().getLastName() : null)")
    @Mapping(target = "reporterId", source = "reporter.id")
    @Mapping(target = "reporterName", expression = "java(issue.getReporter().getFirstName() + ' ' + issue.getReporter().getLastName())")
    @Mapping(target = "sprintId", source = "sprint.id")
    @Mapping(target = "labelIds", expression = "java(issue.getLabels().stream().map(l -> l.getId()).toList())")
    @Mapping(target = "labelNames", expression = "java(issue.getLabels().stream().map(l -> l.getName()).toList())")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    IssueDto toDto(Issue issue);

    List<IssueDto> toDtoList(List<Issue> issues);

    @Mapping(target = "authorId", source = "author.id")
    @Mapping(target = "authorName", expression = "java(comment.getAuthor().getFirstName() + ' ' + comment.getAuthor().getLastName())")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    IssueDto.CommentDto toCommentDto(Comment comment);

    List<IssueDto.CommentDto> toCommentDtoList(List<Comment> comments);
}