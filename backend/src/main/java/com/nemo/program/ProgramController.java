package com.nemo.program;

import com.nemo.common.dto.ApiResponse;
import com.nemo.common.dto.PaginatedResponse;
import com.nemo.common.dto.PaginatedResponse.PaginationInfo;
import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.phase.Deliverable;
import com.nemo.phase.DeliverableDto;
import com.nemo.phase.DeliverableMapper;
import com.nemo.phase.DeliverableRepository;
import com.nemo.pmo.PmoService;
import com.nemo.project.ProjectRepository;
import com.nemo.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/programs")
public class ProgramController {

    private final ProgramService programService;
    private final ProgramMapper programMapper;
    private final AuthHelper authHelper;
    private final PmoService pmoService;
    private final ProjectRepository projectRepository;
    private final DeliverableRepository deliverableRepository;
    private final DeliverableMapper deliverableMapper;

    public ProgramController(ProgramService programService, ProgramMapper programMapper, AuthHelper authHelper, PmoService pmoService, ProjectRepository projectRepository, DeliverableRepository deliverableRepository, DeliverableMapper deliverableMapper) {
        this.programService = programService;
        this.programMapper = programMapper;
        this.authHelper = authHelper;
        this.pmoService = pmoService;
        this.projectRepository = projectRepository;
        this.deliverableRepository = deliverableRepository;
        this.deliverableMapper = deliverableMapper;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ProgramDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long managedBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {

        Page<Program> result;
        if (managedBy != null) {
            result = programService.searchManaged(managedBy, search, page, size, sort);
        } else {
            Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN", "EXECUTIVE") ? null : authHelper.getCurrentCompanyId(currentUser);
            result = programService.search(search, companyId, page, size, sort);
        }
        List<ProgramDto> dtos = programService.enrichWithProjectCount(programMapper.toDtoList(result.getContent()));
        return ResponseEntity.ok(PaginatedResponse.of(
                dtos,
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProgramDto>> get(@PathVariable Long id) {
        ProgramDto dto = programMapper.toDto(programService.getById(id));
        dto = programService.enrichWithProjectCount(List.of(dto)).getFirst();
        return ResponseEntity.ok(ApiResponse.of(dto));
    }

    @GetMapping("/{id}/evm")
    @PreAuthorize("hasAnyRole('MANAGER', 'EXECUTIVE', 'FINANCE')")
    public ResponseEntity<ApiResponse<PmoService.ProgramEvmMetrics>> getEvm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(pmoService.computeProgramEvm(id)));
    }

    @GetMapping("/{id}/milestones")
    public ResponseEntity<ApiResponse<List<DeliverableDto>>> getMilestones(@PathVariable Long id) {
        programService.getById(id); // validate program exists
        List<Long> projectIds = projectRepository.findByProgramId(id).stream()
                .map(p -> p.getId()).toList();
        if (projectIds.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.of(List.of()));
        }
        List<Deliverable> deliverables = deliverableRepository.findByProjectProgramId(projectIds);
        return ResponseEntity.ok(ApiResponse.of(deliverableMapper.toDtoList(deliverables)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProgramDto>> create(
            @Valid @RequestBody ProgramDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = request.companyId();
        if (companyId == null && !authHelper.hasAnyRole(currentUser, "ADMIN")) {
            companyId = authHelper.getCurrentCompanyId(currentUser);
        }
        Program created = programService.create(request, companyId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(programMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProgramDto>> update(@PathVariable Long id, @RequestBody ProgramDto.UpdateRequest request) {
        Program updated = programService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(programMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        programService.delete(id);
        return ResponseEntity.noContent().build();
    }
}