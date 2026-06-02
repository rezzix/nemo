package com.nemo.banktransaction;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BankTransactionMapper {

    @Mapping(target = "bankAccountId", source = "bankAccount.id")
    @Mapping(target = "bankStatementId", source = "bankStatement.id")
    @Mapping(target = "date", source = "date", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    BankTransactionDto toDto(BankTransaction bankTransaction);

    List<BankTransactionDto> toDtoList(List<BankTransaction> bankTransactions);

    @org.mapstruct.Named("statusToString")
    default String statusToString(BankTransaction.Status status) {
        return status != null ? status.name() : null;
    }
}