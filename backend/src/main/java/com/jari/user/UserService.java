package com.jari.user;

import com.jari.common.exception.BadRequestException;
import com.jari.common.exception.DuplicateKeyException;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.common.exception.ForbiddenException;
import com.jari.company.Company;
import com.jari.company.CompanyRepository;
import com.jari.project.Project;
import com.jari.project.ProjectMember;
import com.jari.project.ProjectMemberRepository;
import com.jari.project.ProjectRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, CompanyRepository companyRepository,
                       ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.companyRepository = companyRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    @Transactional(readOnly = true)
    public Page<User> search(String search, User.Role role, Boolean active, Long companyId, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);

        if (companyId != null) {
            return userRepository.searchByCompanyOrGlobal(search, companyId, pageRequest);
        }
        if (search != null) {
            return userRepository.search(search, pageRequest);
        }
        if (role != null) {
            return userRepository.findByRole(role, pageRequest);
        }
        if (active != null) {
            return userRepository.findByActive(active, pageRequest);
        }
        return userRepository.findAll(pageRequest);
    }

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
    }

    @Transactional
    public User create(UserDto.CreateRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateKeyException("Username already exists: " + request.username());
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateKeyException("Email already exists: " + request.email());
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole(User.Role.valueOf(request.role()));
        if (request.companyId() != null) {
            Company company = companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new EntityNotFoundException("Company", request.companyId()));
            user.setCompany(company);
        }
        if (request.assignedProjectId() != null) {
            Project project = projectRepository.findById(request.assignedProjectId())
                    .orElseThrow(() -> new EntityNotFoundException("Project", request.assignedProjectId()));
            user.setAssignedProject(project);
        }
        user.setJobTitle(request.jobTitle());
        user.setDepartment(request.department());
        user.setPhone(request.phone());
        if (request.hireDate() != null && !request.hireDate().isBlank()) {
            user.setHireDate(LocalDate.parse(request.hireDate()));
        }
        user = userRepository.save(user);

        if (user.getAssignedProject() != null && !projectMemberRepository.existsByProjectIdAndUserId(user.getAssignedProject().getId(), user.getId())) {
            projectMemberRepository.save(new ProjectMember(user.getAssignedProject(), user));
        }

        if (user.getRole() == User.Role.EXTERNAL && user.getAssignedProject() == null) {
            throw new BadRequestException("EXTERNAL users must be assigned a project");
        }

        return user;
    }

    @Transactional
    public User update(Long id, UserDto.UpdateRequest request) {
        User user = getById(id);

        if (request.email() != null) {
            if (userRepository.existsByEmail(request.email()) && !user.getEmail().equals(request.email())) {
                throw new DuplicateKeyException("Email already exists: " + request.email());
            }
            user.setEmail(request.email());
        }
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
        if (request.role() != null) user.setRole(User.Role.valueOf(request.role()));
        if (request.active() != null) user.setActive(request.active());
        if (request.companyId() != null) {
            if (request.companyId() == 0) {
                user.setCompany(null);
            } else {
                Company company = companyRepository.findById(request.companyId())
                        .orElseThrow(() -> new EntityNotFoundException("Company", request.companyId()));
                user.setCompany(company);
            }
        }
        if (request.assignedProjectId() != null) {
            if (request.assignedProjectId() == 0) {
                user.setAssignedProject(null);
            } else {
                Project project = projectRepository.findById(request.assignedProjectId())
                        .orElseThrow(() -> new EntityNotFoundException("Project", request.assignedProjectId()));
                user.setAssignedProject(project);
                if (!projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {
                    projectMemberRepository.save(new ProjectMember(project, user));
                }
            }
        }
        if (request.jobTitle() != null) user.setJobTitle(request.jobTitle());
        if (request.department() != null) user.setDepartment(request.department());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.hireDate() != null) {
            user.setHireDate(request.hireDate().isBlank() ? null : LocalDate.parse(request.hireDate()));
        }

        User.Role effectiveRole = request.role() != null ? User.Role.valueOf(request.role()) : user.getRole();
        if (effectiveRole == User.Role.EXTERNAL && user.getAssignedProject() == null) {
            throw new BadRequestException("EXTERNAL users must be assigned a project");
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long id, UserDto.PasswordChangeRequest request, boolean isAdmin) {
        User user = getById(id);

        if (!isAdmin && (request.currentPassword() == null ||
                !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash()))) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deactivate(Long id) {
        User user = getById(id);
        user.setActive(false);
        userRepository.save(user);
    }
}