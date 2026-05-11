package com.jari.presale;

import com.jari.client.Client;
import com.jari.client.ClientContact;
import com.jari.client.ClientContactRepository;
import com.jari.client.ClientRepository;
import com.jari.common.exception.BadRequestException;
import com.jari.common.exception.DuplicateKeyException;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.common.exception.ForbiddenException;
import com.jari.company.Company;
import com.jari.company.CompanyRepository;
import com.jari.program.Program;
import com.jari.program.ProgramRepository;
import com.jari.project.Project;
import com.jari.project.ProjectDto;
import com.jari.project.ProjectService;
import com.jari.timetracking.TimeLog;
import com.jari.timetracking.TimeLogRepository;
import com.jari.timetracking.UserRate;
import com.jari.timetracking.UserRateRepository;
import com.jari.user.User;
import com.jari.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class PreSaleService {

    private final PreSaleRepository preSaleRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ProgramRepository programRepository;
    private final ClientRepository clientRepository;
    private final ClientContactRepository clientContactRepository;
    private final ProjectService projectService;
    private final TimeLogRepository timeLogRepository;
    private final UserRateRepository userRateRepository;

    public PreSaleService(PreSaleRepository preSaleRepository, UserRepository userRepository,
                          CompanyRepository companyRepository, ProgramRepository programRepository,
                          ClientRepository clientRepository, ClientContactRepository clientContactRepository,
                          ProjectService projectService, TimeLogRepository timeLogRepository,
                          UserRateRepository userRateRepository) {
        this.preSaleRepository = preSaleRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.programRepository = programRepository;
        this.clientRepository = clientRepository;
        this.clientContactRepository = clientContactRepository;
        this.projectService = projectService;
        this.timeLogRepository = timeLogRepository;
        this.userRateRepository = userRateRepository;
    }

    @Transactional(readOnly = true)
    public Page<PreSale> search(String search, PreSale.PreSaleStage stage, Long managerId, Long companyId, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        return preSaleRepository.search(search, stage, managerId, companyId, pageRequest);
    }

    @Transactional(readOnly = true)
    public PreSale getById(Long id) {
        return preSaleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PreSale", id));
    }

    @Transactional
    public PreSale create(PreSaleDto.CreateRequest request, Long companyId) {
        if (preSaleRepository.existsByKey(request.key())) {
            throw new DuplicateKeyException("PreSale key already exists: " + request.key());
        }
        User manager = userRepository.findById(request.managerId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));

        PreSale preSale = new PreSale();
        preSale.setName(request.name());
        preSale.setKey(request.key().toUpperCase());
        preSale.setDescription(request.description());
        preSale.setStage(request.stage() != null ? PreSale.PreSaleStage.valueOf(request.stage()) : PreSale.PreSaleStage.LEAD);
        preSale.setManager(manager);

        if (request.clientId() != null) {
            Client client = clientRepository.findById(request.clientId())
                    .orElseThrow(() -> new EntityNotFoundException("Client", request.clientId()));
            preSale.setClient(client);
        }
        if (request.clientContactId() != null) {
            ClientContact contact = clientContactRepository.findById(request.clientContactId())
                    .orElseThrow(() -> new EntityNotFoundException("ClientContact", request.clientContactId()));
            preSale.setClientContact(contact);
        }
        if (request.estimatedValue() != null) preSale.setEstimatedValue(new BigDecimal(request.estimatedValue()));
        if (request.probability() != null) preSale.setProbability(request.probability());
        if (request.expectedCloseDate() != null) preSale.setExpectedCloseDate(LocalDate.parse(request.expectedCloseDate()));

        if (companyId != null) {
            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new EntityNotFoundException("Company", companyId));
            preSale.setCompany(company);
        }
        if (request.programId() != null) {
            Program program = programRepository.findById(request.programId())
                    .orElseThrow(() -> new EntityNotFoundException("Program", request.programId()));
            preSale.setProgram(program);
        }

        return preSaleRepository.save(preSale);
    }

    @Transactional
    public PreSale update(Long id, PreSaleDto.UpdateRequest request) {
        PreSale preSale = getById(id);
        if (request.name() != null) preSale.setName(request.name());
        if (request.description() != null) preSale.setDescription(request.description());
        if (request.stage() != null) {
            PreSale.PreSaleStage newStage = PreSale.PreSaleStage.valueOf(request.stage());
            if (preSale.getConvertedProject() != null && newStage != PreSale.PreSaleStage.WON) {
                throw new BadRequestException("Cannot change stage from WON when project is already converted");
            }
            preSale.setStage(newStage);
        }
        if (request.clientId() != null) {
            Client client = clientRepository.findById(request.clientId())
                    .orElseThrow(() -> new EntityNotFoundException("Client", request.clientId()));
            preSale.setClient(client);
        }
        if (request.clientContactId() != null) {
            ClientContact contact = clientContactRepository.findById(request.clientContactId())
                    .orElseThrow(() -> new EntityNotFoundException("ClientContact", request.clientContactId()));
            preSale.setClientContact(contact);
        }
        if (request.estimatedValue() != null) preSale.setEstimatedValue(new BigDecimal(request.estimatedValue()));
        if (request.probability() != null) preSale.setProbability(request.probability());
        if (request.expectedCloseDate() != null) preSale.setExpectedCloseDate(LocalDate.parse(request.expectedCloseDate()));
        if (request.lostReason() != null) preSale.setLostReason(request.lostReason());
        if (request.managerId() != null) {
            User manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));
            preSale.setManager(manager);
        }
        if (request.programId() != null) {
            Program program = programRepository.findById(request.programId())
                    .orElseThrow(() -> new EntityNotFoundException("Program", request.programId()));
            preSale.setProgram(program);
        }
        return preSaleRepository.save(preSale);
    }

    @Transactional
    public void delete(Long id) {
        PreSale preSale = getById(id);
        preSaleRepository.delete(preSale);
    }

    @Transactional
    public PreSale convertToProject(Long id, PreSaleDto.ConvertRequest request, Long companyId) {
        PreSale preSale = getById(id);
        if (preSale.getConvertedProject() != null) {
            throw new BadRequestException("PreSale is already converted to a project");
        }
        if (preSale.getStage() == PreSale.PreSaleStage.LOST) {
            throw new BadRequestException("Cannot convert a lost PreSale to a project");
        }

        ProjectDto.CreateRequest projectRequest = new ProjectDto.CreateRequest(
                request.projectName(),
                request.projectKey(),
                request.description() != null ? request.description() : preSale.getDescription(),
                request.programId(),
                request.managerId(),
                null, // memberIds
                null, // stage
                null, // strategicScore
                preSale.getEstimatedValue() != null ? preSale.getEstimatedValue().toPlainString() : request.budget(),
                request.budget(),
                request.targetStartDate(),
                request.targetEndDate(),
                companyId
        );

        Project project = projectService.create(projectRequest, companyId);
        preSale.setConvertedProject(project);
        preSale.setStage(PreSale.PreSaleStage.WON);
        return preSaleRepository.save(preSale);
    }

    @Transactional(readOnly = true)
    public PreSaleDto.CostSummaryDto getCostSummary(Long id) {
        PreSale preSale = getById(id);
        List<TimeLog> logs = timeLogRepository.findByPresaleId(id);

        BigDecimal totalHours = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        List<PreSaleDto.UserCostEntry> byUser = new ArrayList<>();

        // Group by user
        var userHours = new java.util.HashMap<Long, BigDecimal>();
        var userNames = new java.util.HashMap<Long, String>();
        for (TimeLog log : logs) {
            BigDecimal hours = log.getHours();
            Long userId = log.getUser().getId();
            userHours.merge(userId, hours, BigDecimal::add);
            userNames.putIfAbsent(userId, log.getUser().getFirstName() + " " + log.getUser().getLastName());
            totalHours = totalHours.add(hours);
        }

        for (var entry : userHours.entrySet()) {
            Long userId = entry.getKey();
            BigDecimal hours = entry.getValue();
            BigDecimal rate = userRateRepository.findEffectiveRate(userId, LocalDate.now())
                    .map(UserRate::getHourlyRate)
                    .orElse(BigDecimal.ZERO);
            BigDecimal cost = hours.multiply(rate).setScale(2, RoundingMode.HALF_UP);
            totalCost = totalCost.add(cost);
            byUser.add(new PreSaleDto.UserCostEntry(userId, userNames.get(userId), hours, rate, cost));
        }

        BigDecimal estimatedValue = preSale.getEstimatedValue() != null ? preSale.getEstimatedValue() : BigDecimal.ZERO;
        BigDecimal margin = estimatedValue.subtract(totalCost);
        BigDecimal marginPercent = estimatedValue.compareTo(BigDecimal.ZERO) > 0
                ? margin.multiply(BigDecimal.valueOf(100)).divide(estimatedValue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new PreSaleDto.CostSummaryDto(totalHours, totalCost, estimatedValue, margin, marginPercent, byUser);
    }
}