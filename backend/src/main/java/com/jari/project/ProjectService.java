package com.jari.project;

import com.jari.client.Client;
import com.jari.client.ClientRepository;
import com.jari.common.exception.BadRequestException;
import com.jari.common.exception.DuplicateKeyException;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.common.exception.ForbiddenException;
import com.jari.company.Company;
import com.jari.company.CompanyRepository;
import com.jari.config.IssueStatus;
import com.jari.config.IssueStatusRepository;
import com.jari.program.Program;
import com.jari.program.ProgramRepository;
import com.jari.issue.IssueRepository;
import com.jari.user.User;
import com.jari.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final LabelRepository labelRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final ProgramRepository programRepository;
    private final UserRepository userRepository;
    private final IssueStatusRepository statusRepository;
    private final IssueRepository issueRepository;
    private final ProjectFavoriteRepository favoriteRepository;
    private final CompanyRepository companyRepository;
    private final ClientRepository clientRepository;
    private final ProjectInstructionRepository instructionRepository;
    private final ProjectNoteRepository noteRepository;

    public ProjectService(ProjectRepository projectRepository, ProjectMemberRepository memberRepository,
                          LabelRepository labelRepository, BoardColumnRepository boardColumnRepository,
                          ProgramRepository programRepository, UserRepository userRepository,
                          IssueStatusRepository statusRepository, IssueRepository issueRepository,
                          ProjectFavoriteRepository favoriteRepository, CompanyRepository companyRepository,
                          ClientRepository clientRepository,
                          ProjectInstructionRepository instructionRepository,
                          ProjectNoteRepository noteRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.labelRepository = labelRepository;
        this.boardColumnRepository = boardColumnRepository;
        this.programRepository = programRepository;
        this.userRepository = userRepository;
        this.statusRepository = statusRepository;
        this.issueRepository = issueRepository;
        this.favoriteRepository = favoriteRepository;
        this.companyRepository = companyRepository;
        this.clientRepository = clientRepository;
        this.instructionRepository = instructionRepository;
        this.noteRepository = noteRepository;
    }

    @Transactional(readOnly = true)
    public Page<Project> search(String search, Long programId, Long managerId, Long companyId, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        return projectRepository.search(search, programId, managerId, companyId, pageRequest);
    }

    @Transactional(readOnly = true)
    public Page<Project> searchByMember(Long userId, Long companyId, int page, int size) {
        return projectRepository.findByMemberUserIdAndCompany(userId, companyId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Project getById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project", id));
    }

    @Transactional
    public Project create(ProjectDto.CreateRequest request, Long companyId) {
        if (projectRepository.existsByKey(request.key())) {
            throw new DuplicateKeyException("Project key already exists: " + request.key());
        }
        Program program = programRepository.findById(request.programId())
                .orElseThrow(() -> new EntityNotFoundException("Program", request.programId()));
        User manager = userRepository.findById(request.managerId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));

        // Validate company consistency
        if (companyId != null && program.getCompany() != null && !program.getCompany().getId().equals(companyId)) {
            throw new ForbiddenException("Program must belong to the same company as the project");
        }
        if (companyId != null && manager.getCompany() != null && !manager.getCompany().getId().equals(companyId)) {
            throw new ForbiddenException("Manager must belong to the same company as the project or be a global user");
        }

        Project project = new Project();
        project.setName(request.name());
        project.setKey(request.key().toUpperCase());
        project.setDescription(request.description());
        project.setProgram(program);
        project.setManager(manager);
        if (companyId != null) {
            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new EntityNotFoundException("Company", companyId));
            project.setCompany(company);
        }
        if (request.clientId() != null) {
            Client client = clientRepository.findById(request.clientId())
                    .orElseThrow(() -> new EntityNotFoundException("Client", request.clientId()));
            project.setClient(client);
        }
        if (request.stage() != null) project.setStage(Project.Stage.valueOf(request.stage()));
        if (request.strategicScore() != null) project.setStrategicScore(request.strategicScore());
        if (request.plannedValue() != null) project.setPlannedValue(new BigDecimal(request.plannedValue()));
        if (request.budget() != null) project.setBudget(new BigDecimal(request.budget()));
        if (request.targetStartDate() != null) project.setTargetStartDate(LocalDate.parse(request.targetStartDate()));
        if (request.targetEndDate() != null) project.setTargetEndDate(LocalDate.parse(request.targetEndDate()));
        project = projectRepository.save(project);

        // Add manager as member
        memberRepository.save(new ProjectMember(project, manager));

        // Add listed members
        if (request.memberIds() != null) {
            for (Long memberId : request.memberIds()) {
                if (!memberId.equals(request.managerId())) {
                    User member = userRepository.findById(memberId)
                            .orElseThrow(() -> new EntityNotFoundException("User", memberId));
                    memberRepository.save(new ProjectMember(project, member));
                }
            }
        }

        // Create default board columns from all statuses
        List<IssueStatus> allStatuses = statusRepository.findAll();
        int position = 0;
        for (IssueStatus status : allStatuses) {
            boardColumnRepository.save(new BoardColumn(project, status, position++));
        }

        return project;
    }

    @Transactional
    public Project update(Long id, ProjectDto.UpdateRequest request) {
        Project project = getById(id);
        if (request.name() != null) project.setName(request.name());
        if (request.description() != null) project.setDescription(request.description());
        if (request.managerId() != null) {
            User manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));
            project.setManager(manager);
        }
        if (request.stage() != null) project.setStage(Project.Stage.valueOf(request.stage()));
        if (request.strategicScore() != null) project.setStrategicScore(request.strategicScore());
        if (request.plannedValue() != null) project.setPlannedValue(new BigDecimal(request.plannedValue()));
        if (request.budget() != null) project.setBudget(new BigDecimal(request.budget()));
        if (request.budgetSpent() != null) project.setBudgetSpent(new BigDecimal(request.budgetSpent()));
        if (request.targetStartDate() != null) project.setTargetStartDate(LocalDate.parse(request.targetStartDate()));
        if (request.targetEndDate() != null) project.setTargetEndDate(LocalDate.parse(request.targetEndDate()));
        if (request.clientId() != null) {
            Client client = clientRepository.findById(request.clientId())
                    .orElseThrow(() -> new EntityNotFoundException("Client", request.clientId()));
            project.setClient(client);
        }
        return projectRepository.save(project);
    }

    // Favorites
    @Transactional(readOnly = true)
    public Set<Long> getFavoriteProjectIds(Long userId) {
        return favoriteRepository.findProjectIdsByUserId(userId);
    }

    @Transactional
    public boolean toggleFavorite(Long projectId, Long userId) {
        getById(projectId); // ensure project exists
        if (favoriteRepository.existsByUserIdAndProjectId(userId, projectId)) {
            favoriteRepository.deleteByUserIdAndProjectId(userId, projectId);
            return false;
        } else {
            User user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("User", userId));
            Project project = getById(projectId);
            favoriteRepository.save(new ProjectFavorite(user, project));
            return true;
        }
    }

    @Transactional
    public void delete(Long id) {
        Project project = getById(id);
        projectRepository.delete(project);
    }

    // Members
    @Transactional(readOnly = true)
    public List<ProjectMember> getMembers(Long projectId) {
        return memberRepository.findByProjectId(projectId);
    }

    @Transactional
    public void addMembers(Long projectId, List<Long> userIds) {
        Project project = getById(projectId);
        for (Long userId : userIds) {
            if (!memberRepository.existsByProjectIdAndUserId(projectId, userId)) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new EntityNotFoundException("User", userId));
                // Validate company compatibility
                if (project.getCompany() != null && user.getCompany() != null
                        && !user.getCompany().getId().equals(project.getCompany().getId())) {
                    throw new ForbiddenException("Cannot add user from a different company to this project");
                }
                memberRepository.save(new ProjectMember(project, user));
            }
        }
    }

    @Transactional
    public void removeMember(Long projectId, Long userId) {
        Project project = getById(projectId);
        if (project.getManager().getId().equals(userId)) {
            throw new ForbiddenException("Cannot remove project manager from project");
        }
        memberRepository.deleteByProjectIdAndUserId(projectId, userId);
    }

    private static final List<Integer> VALID_SCORES = List.of(0, 1, 2, 4, 5);

    @Transactional
    public ProjectMember updateMemberScore(Long projectId, Long userId, Integer score) {
        if (score != null && !VALID_SCORES.contains(score)) {
            throw new BadRequestException("Invalid score. Allowed values: 0, 1, 2, 4, 5");
        }
        List<ProjectMember> members = memberRepository.findByProjectId(projectId);
        ProjectMember pm = members.stream()
                .filter(m -> m.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("ProjectMember", userId));
        pm.setScore(score);
        return memberRepository.save(pm);
    }

    @Transactional(readOnly = true)
    public boolean isMember(Long projectId, Long userId) {
        return memberRepository.existsByProjectIdAndUserId(projectId, userId);
    }

    // Labels
    @Transactional(readOnly = true)
    public List<Label> getLabels(Long projectId) {
        return labelRepository.findByProjectId(projectId);
    }

    @Transactional
    public Label createLabel(Long projectId, ProjectDto.LabelCreateRequest request) {
        Project project = getById(projectId);
        Label label = new Label();
        label.setName(request.name());
        label.setColor(request.color());
        label.setProject(project);
        return labelRepository.save(label);
    }

    @Transactional
    public Label updateLabel(Long projectId, Long labelId, ProjectDto.LabelCreateRequest request) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new EntityNotFoundException("Label", labelId));
        label.setName(request.name());
        label.setColor(request.color());
        return labelRepository.save(label);
    }

    @Transactional
    public void deleteLabel(Long labelId) {
        labelRepository.deleteById(labelId);
    }

    // Board configuration
    @Transactional(readOnly = true)
    public ProjectDto.BoardConfigDto getBoardConfig(Long projectId) {
        Project project = getById(projectId);
        List<BoardColumn> columns = boardColumnRepository.findByProjectIdOrderByPosition(projectId);
        List<ProjectDto.BoardColumnDto> columnDtos = columns.stream().map(col -> {
            long count = issueRepository.countByProjectIdAndStatusId(projectId, col.getStatus().getId());
            return new ProjectDto.BoardColumnDto(col.getId(), col.getStatus().getId(), col.getStatus().getName(), col.getPosition(), count);
        }).toList();
        return new ProjectDto.BoardConfigDto(projectId, columnDtos);
    }

    @Transactional
    public void updateBoardConfig(Long projectId, List<ProjectDto.BoardUpdateRequest.ColumnEntry> entries) {
        Project project = getById(projectId);
        boardColumnRepository.deleteByProjectId(projectId);
        for (ProjectDto.BoardUpdateRequest.ColumnEntry entry : entries) {
            IssueStatus status = statusRepository.findById(entry.statusId())
                    .orElseThrow(() -> new EntityNotFoundException("IssueStatus", entry.statusId()));
            boardColumnRepository.save(new BoardColumn(project, status, entry.position()));
        }
    }

    // Instructions
    @Transactional(readOnly = true)
    public List<ProjectInstruction> getInstructions(Long projectId) {
        return instructionRepository.findByProjectIdOrderByImportantDescCreatedAtDesc(projectId);
    }

    @Transactional
    public ProjectInstruction createInstruction(Long projectId, Long authorId, ProjectDto.InstructionCreateRequest request) {
        Project project = getById(projectId);
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new EntityNotFoundException("User", authorId));
        ProjectInstruction instruction = new ProjectInstruction();
        instruction.setProject(project);
        instruction.setAuthor(author);
        instruction.setContent(request.content());
        instruction.setImportant(request.important() != null && request.important());
        instruction.setVisibleFrom(request.visibleFrom() != null ? LocalDate.parse(request.visibleFrom()) : LocalDate.now());
        instruction.setVisibleTo(request.visibleTo() != null ? LocalDate.parse(request.visibleTo()) : LocalDate.now().plusMonths(1));
        return instructionRepository.save(instruction);
    }

    @Transactional
    public ProjectInstruction updateInstruction(Long id, Long userId, boolean isAdmin, ProjectDto.InstructionUpdateRequest request) {
        ProjectInstruction instruction = instructionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProjectInstruction", id));
        if (!isAdmin && !instruction.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException("Only the author can update their instruction");
        }
        if (request.content() != null) instruction.setContent(request.content());
        if (request.important() != null) instruction.setImportant(request.important());
        if (request.visibleFrom() != null) instruction.setVisibleFrom(LocalDate.parse(request.visibleFrom()));
        if (request.visibleTo() != null) instruction.setVisibleTo(LocalDate.parse(request.visibleTo()));
        return instructionRepository.save(instruction);
    }

    @Transactional
    public void deleteInstruction(Long id, Long userId, boolean isAdmin) {
        ProjectInstruction instruction = instructionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProjectInstruction", id));
        if (!isAdmin && !instruction.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException("Only the author can delete their instruction");
        }
        instructionRepository.delete(instruction);
    }

    // Notes (private to owner)
    @Transactional(readOnly = true)
    public List<ProjectNote> getNotes(Long projectId, Long ownerId) {
        return noteRepository.findByProjectIdAndOwnerIdOrderByPinnedDescCreatedAtDesc(projectId, ownerId);
    }

    @Transactional
    public ProjectNote createNote(Long projectId, Long ownerId, ProjectDto.NoteCreateRequest request) {
        Project project = getById(projectId);
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("User", ownerId));
        ProjectNote note = new ProjectNote();
        note.setProject(project);
        note.setOwner(owner);
        note.setContent(request.content());
        note.setPinned(request.pinned() != null && request.pinned());
        return noteRepository.save(note);
    }

    @Transactional
    public ProjectNote updateNote(Long id, Long ownerId, ProjectDto.NoteUpdateRequest request) {
        ProjectNote note = noteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProjectNote", id));
        if (!note.getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("Only the owner can update their note");
        }
        if (request.content() != null) note.setContent(request.content());
        if (request.pinned() != null) note.setPinned(request.pinned());
        return noteRepository.save(note);
    }

    @Transactional
    public void deleteNote(Long id, Long ownerId) {
        ProjectNote note = noteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProjectNote", id));
        if (!note.getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("Only the owner can delete their note");
        }
        noteRepository.delete(note);
    }
}