package com.nemo.program;

import com.nemo.common.exception.DuplicateKeyException;
import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.common.exception.ForbiddenException;
import com.nemo.company.Company;
import com.nemo.company.CompanyRepository;
import com.nemo.project.ProjectRepository;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProgramService {

    private final ProgramRepository programRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;

    public ProgramService(ProgramRepository programRepository, UserRepository userRepository, CompanyRepository companyRepository, ProjectRepository projectRepository) {
        this.programRepository = programRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public Page<Program> search(String search, Long companyId, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        if (companyId != null) {
            if (search != null && !search.isBlank()) {
                return programRepository.searchByCompany(search, companyId, pageRequest);
            }
            return programRepository.findByCompanyIdOrNull(companyId, pageRequest);
        }
        if (search != null && !search.isBlank()) {
            return programRepository.search(search, pageRequest);
        }
        return programRepository.findAll(pageRequest);
    }

    @Transactional(readOnly = true)
    public Page<Program> searchManaged(Long managerId, String search, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        if (search != null && !search.isBlank()) {
            return programRepository.findByManagerIdWithSearch(managerId, search, pageRequest);
        }
        return programRepository.findByManagerId(managerId, pageRequest);
    }

    @Transactional(readOnly = true)
    public List<ProgramDto> enrichWithProjectCount(List<ProgramDto> dtos) {
        return dtos.stream().map(dto ->
                new ProgramDto(dto.id(), dto.name(), dto.key(), dto.description(),
                        dto.managerId(), dto.managerName(),
                        dto.companyId(), dto.companyName(),
                        projectRepository.countByProgramId(dto.id()),
                        dto.createdAt(), dto.updatedAt())
        ).toList();
    }

    @Transactional(readOnly = true)
    public Program getById(Long id) {
        return programRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Program", id));
    }

    @Transactional
    public Program create(ProgramDto.CreateRequest request, Long companyId) {
        if (programRepository.existsByKey(request.key())) {
            throw new DuplicateKeyException("Program key already exists: " + request.key());
        }
        User manager = userRepository.findById(request.managerId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));

        if (companyId != null && manager.getCompany() != null && !manager.getCompany().getId().equals(companyId)) {
            throw new ForbiddenException("Manager must belong to the same company as the program or be a global user");
        }

        Program program = new Program();
        program.setName(request.name());
        program.setKey(request.key().toUpperCase());
        program.setDescription(request.description());
        program.setManager(manager);
        if (companyId != null) {
            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new EntityNotFoundException("Company", companyId));
            program.setCompany(company);
        }
        return programRepository.save(program);
    }

    @Transactional
    public Program update(Long id, ProgramDto.UpdateRequest request) {
        Program program = getById(id);
        if (request.name() != null) program.setName(request.name());
        if (request.description() != null) program.setDescription(request.description());
        if (request.managerId() != null) {
            User manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));
            program.setManager(manager);
        }
        return programRepository.save(program);
    }

    @Transactional
    public void delete(Long id) {
        Program program = getById(id);
        programRepository.delete(program);
    }
}