package com.nemo.pmo;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RaidItemMapper {

    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "projectName", source = "project.name")
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "ownerName", expression = "java(item.getOwner() != null ? item.getOwner().getFirstName() + ' ' + item.getOwner().getLastName() : null)")
    @Mapping(target = "riskScore", source = "item")
    @Mapping(target = "dueDate", source = "dueDate", dateFormat = "yyyy-MM-dd")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    RaidItemDto toDto(RaidItem item);

    List<RaidItemDto> toDtoList(List<RaidItem> items);

    default int mapRiskScore(RaidItem item) {
        return item.getRiskScore();
    }
}