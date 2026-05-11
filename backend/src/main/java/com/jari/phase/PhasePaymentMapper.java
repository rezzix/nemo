package com.jari.phase;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PhasePaymentMapper {

    @Mapping(target = "phaseId", source = "phase.id")
    @Mapping(target = "paymentDate", source = "paymentDate", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    PhasePaymentDto toDto(PhasePayment payment);

    List<PhasePaymentDto> toDtoList(List<PhasePayment> payments);
}