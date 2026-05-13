package com.nemo.leave;

import com.nemo.user.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface LeaveRequestMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", source = "user")
    @Mapping(target = "type", source = "type")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "approverId", source = "approver.id")
    @Mapping(target = "approverName", source = "approver")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss")
    LeaveRequestDto toDto(LeaveRequest entity);

    List<LeaveRequestDto> toDtoList(List<LeaveRequest> entities);

    default String map(User user) {
        if (user == null) return null;
        return user.getFirstName() + " " + user.getLastName();
    }

    default String mapType(LeaveRequest.Type type) {
        return type != null ? type.name() : null;
    }

    default String mapStatus(LeaveRequest.Status status) {
        return status != null ? status.name() : null;
    }
}