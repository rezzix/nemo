package com.nemo.timetracking;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserRateMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "username", expression = "java(rate.getUser().getUsername())")
    @Mapping(target = "effectiveFrom", source = "effectiveFrom", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    UserRateDto toDto(UserRate rate);

    List<UserRateDto> toDtoList(List<UserRate> rates);
}