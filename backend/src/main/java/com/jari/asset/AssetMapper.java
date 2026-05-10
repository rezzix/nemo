package com.jari.asset;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AssetMapper {

    @Mapping(target = "type", source = "type", qualifiedByName = "typeToString")
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    @Mapping(target = "locationId", source = "location.id")
    @Mapping(target = "locationName", source = "location.name")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", expression = "java(asset.getUser() != null ? asset.getUser().getFirstName() + ' ' + asset.getUser().getLastName() : null)")
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "purchaseDate", source = "purchaseDate")
    @Mapping(target = "purchaseCost", source = "purchaseCost")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    AssetDto toDto(Asset asset);

    List<AssetDto> toDtoList(List<Asset> assets);

    @org.mapstruct.Named("typeToString")
    default String typeToString(Asset.Type type) {
        return type != null ? type.name() : null;
    }

    @org.mapstruct.Named("statusToString")
    default String statusToString(Asset.Status status) {
        return status != null ? status.name() : null;
    }
}