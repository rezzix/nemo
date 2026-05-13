package com.nemo.timetracking;

import com.nemo.common.exception.BadRequestException;
import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.task.Task;
import com.nemo.task.TaskRepository;
import com.nemo.presale.PreSale;
import com.nemo.presale.PreSaleRepository;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
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
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final PreSaleRepository preSaleRepository;

    public TimeLogService(TimeLogRepository timeLogRepository, TaskRepository taskRepository,
                          UserRepository userRepository, PreSaleRepository preSaleRepository) {
        this.timeLogRepository = timeLogRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.preSaleRepository = preSaleRepository;
    }

    @Transactional
    public TimeLog create(TimeLogDto.CreateRequest request, Long userId) {
        if (request.taskId() == null && request.presaleId() == null) {
            throw new BadRequestException("Either taskId or presaleId must be provided");
        }
        if (request.taskId() != null && request.presaleId() != null) {
            throw new BadRequestException("Only one of taskId or presaleId should be provided, not both");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        TimeLog timeLog = new TimeLog();
        timeLog.setHours(request.hours());
        timeLog.setLogDate(request.logDate());
        timeLog.setDescription(request.description());
        timeLog.setUser(user);

        if (request.taskId() != null) {
            Task task = taskRepository.findById(request.taskId())
                    .orElseThrow(() -> new EntityNotFoundException("Task", request.taskId()));
            timeLog.setTask(task);
        }

        if (request.presaleId() != null) {
            PreSale presale = preSaleRepository.findById(request.presaleId())
                    .orElseThrow(() -> new EntityNotFoundException("PreSale", request.presaleId()));
            timeLog.setPresale(presale);
        }

        return timeLogRepository.save(timeLog);
    }

    @Transactional(readOnly = true)
    public Page<TimeLog> search(Long userId, Long taskId, Long projectId, Long presaleId, LocalDate startDate, LocalDate endDate, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        return timeLogRepository.search(userId, taskId, projectId, presaleId, startDate, endDate, pageRequest);
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