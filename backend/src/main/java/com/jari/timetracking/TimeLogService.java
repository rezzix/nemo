package com.jari.timetracking;

import com.jari.common.exception.BadRequestException;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.issue.Issue;
import com.jari.issue.IssueRepository;
import com.jari.presale.PreSale;
import com.jari.presale.PreSaleRepository;
import com.jari.user.User;
import com.jari.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final PreSaleRepository preSaleRepository;

    public TimeLogService(TimeLogRepository timeLogRepository, IssueRepository issueRepository,
                          UserRepository userRepository, PreSaleRepository preSaleRepository) {
        this.timeLogRepository = timeLogRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.preSaleRepository = preSaleRepository;
    }

    @Transactional
    public TimeLog create(TimeLogDto.CreateRequest request, Long userId) {
        if (request.issueId() == null && request.presaleId() == null) {
            throw new BadRequestException("Either issueId or presaleId must be provided");
        }
        if (request.issueId() != null && request.presaleId() != null) {
            throw new BadRequestException("Only one of issueId or presaleId should be provided, not both");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        TimeLog timeLog = new TimeLog();
        timeLog.setHours(request.hours());
        timeLog.setLogDate(request.logDate());
        timeLog.setDescription(request.description());
        timeLog.setUser(user);

        if (request.issueId() != null) {
            Issue issue = issueRepository.findById(request.issueId())
                    .orElseThrow(() -> new EntityNotFoundException("Issue", request.issueId()));
            timeLog.setIssue(issue);
        }

        if (request.presaleId() != null) {
            PreSale presale = preSaleRepository.findById(request.presaleId())
                    .orElseThrow(() -> new EntityNotFoundException("PreSale", request.presaleId()));
            timeLog.setPresale(presale);
        }

        return timeLogRepository.save(timeLog);
    }

    @Transactional(readOnly = true)
    public Page<TimeLog> search(Long userId, Long issueId, Long projectId, Long presaleId, LocalDate startDate, LocalDate endDate, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        return timeLogRepository.search(userId, issueId, projectId, presaleId, startDate, endDate, pageRequest);
    }

    @Transactional(readOnly = true)
    public TimeLog getById(Long id) {
        return timeLogRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TimeLog", id));
    }

    @Transactional
    public TimeLog update(Long id, TimeLogDto.UpdateRequest request) {
        TimeLog timeLog = getById(id);
        if (request.hours() != null) timeLog.setHours(request.hours());
        if (request.logDate() != null) timeLog.setLogDate(request.logDate());
        if (request.description() != null) timeLog.setDescription(request.description());
        return timeLogRepository.save(timeLog);
    }

    @Transactional
    public void delete(Long id) {
        TimeLog timeLog = getById(id);
        timeLogRepository.delete(timeLog);
    }

    @Transactional(readOnly = true)
    public List<TimeLog> getWeeklyTimesheet(Long userId, LocalDate weekStart, LocalDate weekEnd) {
        return timeLogRepository.findByUserIdAndLogDateBetween(userId, weekStart, weekEnd);
    }

    @Transactional(readOnly = true)
    public List<TimeLog> getDailyTimesheet(Long userId, LocalDate date) {
        return timeLogRepository.findByUserIdAndLogDateBetween(userId, date, date);
    }

    @Transactional(readOnly = true)
    public List<TimeLog> getByPresaleId(Long presaleId) {
        return timeLogRepository.findByPresaleId(presaleId);
    }
}