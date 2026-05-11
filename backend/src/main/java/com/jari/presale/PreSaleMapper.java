package com.jari.presale;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PreSaleMapper {

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientName", source = "client.name")
    @Mapping(target = "clientContactId", source = "clientContact.id")
    @Mapping(target = "clientContactName", source = "clientContact.name")
    @Mapping(target = "managerId", source = "manager.id")
    @Mapping(target = "managerName", source = "manager.firstName")
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "programId", source = "program.id")
    @Mapping(target = "programName", source = "program.name")
    @Mapping(target = "convertedProjectId", source = "convertedProject.id")
    @Mapping(target = "convertedProjectName", source = "convertedProject.name")
    @Mapping(target = "estimatedValue", source = "estimatedValue")
    @Mapping(target = "expectedCloseDate", source = "expectedCloseDate", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    PreSaleDto toDto(PreSale preSale);

    List<PreSaleDto> toDtoList(List<PreSale> preSales);
}