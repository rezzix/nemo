package com.nemo.project;

import com.nemo.common.dto.ApiResponse;
import com.nemo.common.dto.PaginatedResponse;
import com.nemo.common.dto.PaginatedResponse.PaginationInfo;
import com.nemo.common.exception.ForbiddenException;
import com.nemo.security.AuthHelper;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectMapper projectMapper;
    private final AuthHelper authHelper;
    private final UserRepository userRepository;

    public ProjectController(ProjectService projectService, ProjectMapper projectMapper, AuthHelper authHelper, UserRepository userRepository) {
        this.projectService = projectService;
        this.projectMapper = projectMapper;
        this.authHelper = authHelper;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ProjectDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long programId,
            @RequestParam(required = false) Long managerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {

        Long userId = authHelper.getCurrentUserId(currentUser);
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        boolean isAdmin = authHelper.hasAnyRole(currentUser, "ADMIN");
        boolean isManagerOrExecutive = authHelper.hasAnyRole(currentUser, "MANAGER", "EXECUTIVE");
        boolean isHr = authHelper.hasAnyRole(currentUser, "HR");
        boolean isExternal = authHelper.isExternal(currentUser);

        Page<Project> result;
        if (isExternal) {
            User user = userRepository.findById(userId).orElseThrow();
            if (user.getAssignedProject() != null) {
                result = new PageImpl<>(List.of(user.getAssignedProject()));
            } else {
                result = Page.empty();
            }
        } else if (isAdmin) {
            result = projectService.search(search, programId, managerId, null, page, size, sort);
        } else if (isManagerOrExecutive || isHr) {
            result = projectService.search(search, programId, managerId, companyId, page, size, sort);
        } else {
            result = projectService.searchByMember(userId, companyId, page, size);
        }

        Set<Long> favoriteIds = projectService.getFavoriteProjectIds(userId);
        List<ProjectDto> dtos = projectMapper.toDtoList(result.getContent()).stream()
                .map(dto -> new ProjectDto(dto.id(), dto.name(), dto.key(), dto.description(),
                        dto.programId(), dto.programName(), dto.managerId(), dto.managerName(),
                        dto.companyId(), dto.companyName(), dto.clientId(), dto.clientName(),
                        dto.stage(), dto.strategicScore(), dto.plannedValue(), dto.budget(), dto.budgetSpent(),
                        dto.targetStartDate(), dto.targetEndDate(),
                        favoriteIds.contains(dto.id()),
                        dto.createdAt(), dto.updatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(PaginatedResponse.of(
                dtos,
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> get(@PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, id);
        Long userId = authHelper.getCurrentUserId(currentUser);
        ProjectDto dto = projectMapper.toDto(projectService.getById(id));
        Set<Long> favoriteIds = projectService.getFavoriteProjectIds(userId);
        ProjectDto enriched = new ProjectDto(dto.id(), dto.name(), dto.key(), dto.description(),
                dto.programId(), dto.programName(), dto.managerId(), dto.managerName(),
                dto.companyId(), dto.companyName(), dto.clientId(), dto.clientName(),
                dto.stage(), dto.strategicScore(), dto.plannedValue(), dto.budget(), dto.budgetSpent(),
                dto.targetStartDate(), dto.targetEndDate(),
                favoriteIds.contains(dto.id()),
                dto.createdAt(), dto.updatedAt());
        return ResponseEntity.ok(ApiResponse.of(enriched));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> create(
            @Valid @RequestBody ProjectDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = request.companyId();
        if (companyId == null && !authHelper.hasAnyRole(currentUser, "ADMIN")) {
            companyId = authHelper.getCurrentCompanyId(currentUser);
        }
        Project created = projectService.create(request, companyId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(projectMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> update(@PathVariable Long id, @RequestBody ProjectDto.UpdateRequest request) {
        Project updated = projectService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(projectMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Favorites
    @PostMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<ProjectDto>> toggleFavorite(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        boolean isFavorite = projectService.toggleFavorite(id, userId);
        return get(id, currentUser);
    }

    // Members
    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<ProjectDto.MemberDto>>> getMembers(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, id);
        List<ProjectDto.MemberDto> members = projectService.getMembers(id).stream()
                .map(projectMapper::toMemberDto).toList();
        // Contributors and external users cannot see evaluation scores
        boolean canSeeScores = currentUser.getAuthorities().stream()
                .anyMatch(a -> Set.of("ROLE_ADMIN", "ROLE_MANAGER", "ROLE_EXECUTIVE", "ROLE_HR").contains(a.getAuthority()));
        if (!canSeeScores) {
            members = members.stream()
                    .map(m -> new ProjectDto.MemberDto(m.id(), m.userId(), m.username(), m.fullName(), null))
                    .toList();
        }
        return ResponseEntity.ok(ApiResponse.of(members));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Object>> addMembers(@PathVariable Long id, @RequestBody MemberRequest request) {
        projectService.addMembers(id, request.userIds());
        return ResponseEntity.ok(ApiResponse.of("Members added"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        projectService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/members/{userId}/score")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto.MemberDto>> updateMemberScore(
            @PathVariable Long id, @PathVariable Long userId,
            @RequestBody @Valid ProjectDto.ScoreRequest request) {
        ProjectMember pm = projectService.updateMemberScore(id, userId, request.score());
        return ResponseEntity.ok(ApiResponse.of(projectMapper.toMemberDto(pm)));
    }

    // Labels
    @GetMapping("/{id}/labels")
    public ResponseEntity<ApiResponse<List<ProjectDto.LabelDto>>> getLabels(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, id);
        List<ProjectDto.LabelDto> labels = projectService.getLabels(id).stream()
                .map(l -> new ProjectDto.LabelDto(l.getId(), l.getName(), l.getColor())).toList();
        return ResponseEntity.ok(ApiResponse.of(labels));
    }

    @PostMapping("/{id}/labels")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto.LabelDto>> createLabel(
            @PathVariable Long id, @Valid @RequestBody ProjectDto.LabelCreateRequest request) {
        Label label = projectService.createLabel(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.of(new ProjectDto.LabelDto(label.getId(), label.getName(), label.getColor())));
    }

    @PutMapping("/{id}/labels/{labelId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto.LabelDto>> updateLabel(
            @PathVariable Long id, @PathVariable Long labelId, @Valid @RequestBody ProjectDto.LabelCreateRequest request) {
        Label label = projectService.updateLabel(id, labelId, request);
        return ResponseEntity.ok(ApiResponse.of(new ProjectDto.LabelDto(label.getId(), label.getName(), label.getColor())));
    }

    @DeleteMapping("/{id}/labels/{labelId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteLabel(@PathVariable Long id, @PathVariable Long labelId) {
        projectService.deleteLabel(labelId);
        return ResponseEntity.noContent().build();
    }

    // Board
    @GetMapping("/{id}/board")
    public ResponseEntity<ApiResponse<ProjectDto.BoardConfigDto>> getBoard(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, id);
        return ResponseEntity.ok(ApiResponse.of(projectService.getBoardConfig(id)));
    }

    @PutMapping("/{id}/board")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto.BoardConfigDto>> updateBoard(
            @PathVariable Long id, @RequestBody ProjectDto.BoardUpdateRequest request) {
        projectService.updateBoardConfig(id, request.columns());
        return ResponseEntity.ok(ApiResponse.of(projectService.getBoardConfig(id)));
    }

    public record MemberRequest(List<Long> userIds) {}

    // Instructions
    @GetMapping("/{id}/instructions")
    public ResponseEntity<ApiResponse<List<ProjectDto.InstructionDto>>> getInstructions(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, id);
        List<ProjectDto.InstructionDto> instructions = projectService.getInstructions(id).stream()
                .map(i -> new ProjectDto.InstructionDto(i.getId(), i.getProject().getId(),
                        i.getAuthor().getId(), i.getAuthor().getFirstName() + " " + i.getAuthor().getLastName(),
                        i.getContent(), i.isImportant(),
                        i.getVisibleFrom() != null ? i.getVisibleFrom().toString() : null,
                        i.getVisibleTo() != null ? i.getVisibleTo().toString() : null,
                        i.getCreatedAt().toString(), i.getUpdatedAt().toString()))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(instructions));
    }

    @PostMapping("/{id}/instructions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<ProjectDto.InstructionDto>> createInstruction(
            @PathVariable Long id, @Valid @RequestBody ProjectDto.InstructionCreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        ProjectInstruction instruction = projectService.createInstruction(id, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(
                new ProjectDto.InstructionDto(instruction.getId(), instruction.getProject().getId(),
                        instruction.getAuthor().getId(), instruction.getAuthor().getFirstName() + " " + instruction.getAuthor().getLastName(),
                        instruction.getContent(), instruction.isImportant(),
                        instruction.getVisibleFrom() != null ? instruction.getVisibleFrom().toString() : null,
                        instruction.getVisibleTo() != null ? instruction.getVisibleTo().toString() : null,
                        instruction.getCreatedAt().toString(), instruction.getUpdatedAt().toString())));
    }

    @PutMapping("/{id}/instructions/{instructionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<ProjectDto.InstructionDto>> updateInstruction(
            @PathVariable Long id, @PathVariable Long instructionId,
            @RequestBody ProjectDto.InstructionUpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        boolean isAdmin = authHelper.hasAnyRole(currentUser, "ADMIN");
        ProjectInstruction instruction = projectService.updateInstruction(instructionId, userId, isAdmin, request);
        return ResponseEntity.ok(ApiResponse.of(
                new ProjectDto.InstructionDto(instruction.getId(), instruction.getProject().getId(),
                        instruction.getAuthor().getId(), instruction.getAuthor().getFirstName() + " " + instruction.getAuthor().getLastName(),
                        instruction.getContent(), instruction.isImportant(),
                        instruction.getVisibleFrom() != null ? instruction.getVisibleFrom().toString() : null,
                        instruction.getVisibleTo() != null ? instruction.getVisibleTo().toString() : null,
                        instruction.getCreatedAt().toString(), instruction.getUpdatedAt().toString())));
    }

    @DeleteMapping("/{id}/instructions/{instructionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<Void> deleteInstruction(
            @PathVariable Long id, @PathVariable Long instructionId,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        boolean isAdmin = authHelper.hasAnyRole(currentUser, "ADMIN");
        projectService.deleteInstruction(instructionId, userId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    // Notes (private)
    @GetMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<List<ProjectDto.NoteDto>>> getNotes(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, id);
        Long userId = authHelper.getCurrentUserId(currentUser);
        List<ProjectDto.NoteDto> notes = projectService.getNotes(id, userId).stream()
                .map(n -> new ProjectDto.NoteDto(n.getId(), n.getProject().getId(),
                        n.getContent(), n.isPinned(),
                        n.getCreatedAt().toString(), n.getUpdatedAt().toString()))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(notes));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<ProjectDto.NoteDto>> createNote(
            @PathVariable Long id, @Valid @RequestBody ProjectDto.NoteCreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, id);
        Long userId = authHelper.getCurrentUserId(currentUser);
        ProjectNote note = projectService.createNote(id, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(
                new ProjectDto.NoteDto(note.getId(), note.getProject().getId(),
                        note.getContent(), note.isPinned(),
                        note.getCreatedAt().toString(), note.getUpdatedAt().toString())));
    }

    @PutMapping("/{id}/notes/{noteId}")
    public ResponseEntity<ApiResponse<ProjectDto.NoteDto>> updateNote(
            @PathVariable Long id, @PathVariable Long noteId,
            @RequestBody ProjectDto.NoteUpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        ProjectNote note = projectService.updateNote(noteId, userId, request);
        return ResponseEntity.ok(ApiResponse.of(
                new ProjectDto.NoteDto(note.getId(), note.getProject().getId(),
                        note.getContent(), note.isPinned(),
                        note.getCreatedAt().toString(), note.getUpdatedAt().toString())));
    }

    @DeleteMapping("/{id}/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id, @PathVariable Long noteId,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        projectService.deleteNote(noteId, userId);
        return ResponseEntity.noContent().build();
    }
}