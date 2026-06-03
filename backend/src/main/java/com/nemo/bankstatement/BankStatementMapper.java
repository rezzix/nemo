package com.nemo.bankstatement;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BankStatementMapper {

    @Mapping(target = "bankAccountId", source = "bankAccount.id")
    @Mapping(target = "transactionCount", expression = "java(0)")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    BankStatementDto toDto(BankStatement bankStatement);

    List<BankStatementDto> toDtoList(List<BankStatement> bankStatements);
}