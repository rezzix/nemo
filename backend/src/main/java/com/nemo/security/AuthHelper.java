package com.nemo.security;

import com.nemo.common.exception.ForbiddenException;
import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.project.Project;
import com.nemo.project.ProjectService;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class AuthHelper {

    private final ProjectService projectService;
    private final UserRepository userRepository;

    public AuthHelper(ProjectService projectService, UserRepository userRepository) {
        this.projectService = projectService;
        this.userRepository = userRepository;
    }

    public Long getCurrentUserId(UserDetails currentUser) {
        if (currentUser instanceof CustomUserDetails details) {
            return details.getUserId();
        }
        return Long.parseLong(currentUser.getUsername());
    }

    public Long getCurrentCompanyId(UserDetails currentUser) {
        if (currentUser instanceof CustomUserDetails details) {
            return details.getCompanyId();
        }
        return null;
    }

    public boolean isGlobalUser(UserDetails currentUser) {
        return getCurrentCompanyId(currentUser) == null;
    }

    public boolean hasAnyRole(UserDetails currentUser, String... roles) {
        for (String role : roles) {
            if (currentUser.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_" + role))) {
                return true;
            }
        }
        return false;
    }

    public boolean isExternal(UserDetails currentUser) {
        return hasAnyRole(currentUser, "EXTERNAL");
    }

    public boolean canAccessProject(UserDetails currentUser, Project project) {
        if (hasAnyRole(currentUser, "ADMIN")) return true;
        if (project.getCompany() == null) return true;
        Long userCompanyId = getCurrentCompanyId(currentUser);
        if (userCompanyId == null) return true;
        return project.getCompany().getId().equals(userCompanyId);
    }

    public boolean canAccessUser(UserDetails currentUser, User targetUser) {
        if (hasAnyRole(currentUser, "ADMIN")) return true;
        Long userCompanyId = getCurrentCompanyId(currentUser);
        if (userCompanyId == null) return true;
        return targetUser.getCompany() == null ||
                targetUser.getCompany().getId().equals(userCompanyId);
    }

    public void requireProjectReadAccess(UserDetails currentUser, Long projectId) {
        if (hasAnyRole(currentUser, "ADMIN")) return;
        Project project = projectService.getById(projectId);
        if (!canAccessProject(currentUser, project)) {
            throw new ForbiddenException("You do not have access to this project");
        }
        if (hasAnyRole(currentUser, "MANAGER", "EXECUTIVE", "HR")) return;
        if (isExternal(currentUser)) {
            User user = userRepository.findById(getCurrentUserId(currentUser))
                    .orElseThrow(() -> new EntityNotFoundException("User", getCurrentUserId(currentUser)));
            if (user.getAssignedProject() != null && user.getAssignedProject().getId().equals(projectId)) return;
            throw new ForbiddenException("You do not have access to this project");
        }
        Long userId = getCurrentUserId(currentUser);
        if (!projectService.isMember(projectId, userId)) {
            throw new ForbiddenException("You do not have access to this project");
        }
    }

    public void requireProjectMemberOrAdminManager(UserDetails currentUser, Long projectId) {
        if (hasAnyRole(currentUser, "ADMIN")) return;
        Project project = projectService.getById(projectId);
        if (!canAccessProject(currentUser, project)) {
            throw new ForbiddenException("You do not have access to this project");
        }
        if (hasAnyRole(currentUser, "MANAGER", "HR")) return;
        if (isExternal(currentUser)) {
            User user = userRepository.findById(getCurrentUserId(currentUser))
                    .orElseThrow(() -> new EntityNotFoundException("User", getCurrentUserId(currentUser)));
            if (user.getAssignedProject() != null && user.getAssignedProject().getId().equals(projectId)) return;
            throw new ForbiddenException("You do not have access to this project");
        }
        Long userId = getCurrentUserId(currentUser);
        if (!projectService.isMember(projectId, userId)) {
            throw new ForbiddenException("You do not have access to this project");
        }
    }

    public void requireSelfOrAdmin(UserDetails currentUser, Long targetUserId) {
        if (hasAnyRole(currentUser, "ADMIN")) return;
        Long userId = getCurrentUserId(currentUser);
        if (!userId.equals(targetUserId)) {
            throw new ForbiddenException("You can only modify your own data");
        }
    }

    public void requireCompanyAccessToUser(UserDetails currentUser, Long targetUserId) {
        if (hasAnyRole(currentUser, "ADMIN")) return;
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new com.nemo.common.exception.EntityNotFoundException("User", targetUserId));
        if (!canAccessUser(currentUser, targetUser)) {
            throw new ForbiddenException("You do not have access to this user");
        }
    }
}