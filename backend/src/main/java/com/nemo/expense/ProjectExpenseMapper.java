package com.nemo.expense;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProjectExpenseMapper {

    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", expression = "java(expense.getCreatedBy() != null ? expense.getCreatedBy().getFirstName() + ' ' + expense.getCreatedBy().getLastName() : null)")
    @Mapping(target = "amount", source = "amount", dateFormat = "#,##0.00")
    @Mapping(target = "expenseDate", source = "expenseDate", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    ProjectExpenseDto toDto(ProjectExpense expense);

    List<ProjectExpenseDto> toDtoList(List<ProjectExpense> expenses);
}