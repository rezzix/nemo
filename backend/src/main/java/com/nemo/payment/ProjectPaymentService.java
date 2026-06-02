package com.nemo.payment;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.config.OrganizationConfig;
import com.nemo.config.OrganizationConfigRepository;
import com.nemo.project.Project;
import com.nemo.project.ProjectService;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ProjectPaymentService {

    private final ProjectPaymentRepository paymentRepository;
    private final ProjectService projectService;
    private final UserRepository userRepository;
    private final OrganizationConfigRepository configRepository;

    public ProjectPaymentService(ProjectPaymentRepository paymentRepository, ProjectService projectService, UserRepository userRepository, OrganizationConfigRepository configRepository) {
        this.paymentRepository = paymentRepository;
        this.projectService = projectService;
        this.userRepository = userRepository;
        this.configRepository = configRepository;
    }

    public List<ProjectPayment> getByProjectId(Long projectId) {
        List<ProjectPayment> payments = paymentRepository.findByProjectIdOrderByDueDateAsc(projectId);
        payments.forEach(this::computeOverdue);
        return payments;
    }

    public ProjectPayment getById(Long id) {
        ProjectPayment payment = paymentRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Payment", id));
        computeOverdue(payment);
        return payment;
    }

    @Transactional
    public ProjectPayment create(Long projectId, Long userId, ProjectPaymentDto.CreateRequest request) {
        Project project = projectService.getById(projectId);
        User user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("User", userId));
        ProjectPayment payment = new ProjectPayment();
        payment.setProject(project);
        payment.setTitle(request.title());
        payment.setAmount(request.amount());
        if (request.currency() != null) {
            payment.setCurrency(request.currency());
        } else {
            String resolvedCurrency = resolveCurrency(project);
            if (resolvedCurrency != null) {
                payment.setCurrency(resolvedCurrency);
            }
        }
        payment.setDueDate(request.dueDate() != null ? LocalDate.parse(request.dueDate()) : null);
        payment.setInvoiceRef(request.invoiceRef());
        payment.setNotes(request.notes());
        payment.setStatus(ProjectPayment.PaymentStatus.PENDING);
        payment.setCreatedBy(user);
        return paymentRepository.save(payment);
    }

    @Transactional
    public ProjectPayment update(Long id, ProjectPaymentDto.UpdateRequest request) {
        ProjectPayment payment = paymentRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Payment", id));
        if (request.title() != null) payment.setTitle(request.title());
        if (request.amount() != null) payment.setAmount(request.amount());
        if (request.currency() != null) payment.setCurrency(request.currency());
        if (request.dueDate() != null) payment.setDueDate(LocalDate.parse(request.dueDate()));
        if (request.invoiceRef() != null) payment.setInvoiceRef(request.invoiceRef());
        if (request.notes() != null) payment.setNotes(request.notes());
        return paymentRepository.save(payment);
    }

    @Transactional
    public ProjectPayment markReceived(Long id) {
        ProjectPayment payment = paymentRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Payment", id));
        payment.setStatus(ProjectPayment.PaymentStatus.RECEIVED);
        payment.setReceivedDate(LocalDate.now());
        return paymentRepository.save(payment);
    }

    @Transactional
    public void cancel(Long id) {
        ProjectPayment payment = paymentRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Payment", id));
        payment.setStatus(ProjectPayment.PaymentStatus.CANCELLED);
        paymentRepository.save(payment);
    }

    public BigDecimal sumReceivedByProjectId(Long projectId) {
        BigDecimal sum = paymentRepository.sumAmountByProjectIdAndStatus(projectId, ProjectPayment.PaymentStatus.RECEIVED);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    private String resolveCurrency(Project project) {
        // 1. Try company-specific config
        if (project.getCompany() != null) {
            String currency = configRepository.findByCompanyId(project.getCompany().getId())
                    .map(OrganizationConfig::getCurrency).orElse(null);
            if (currency != null) {
                return currency;
            }
        }
        // 2. Fall back to global config
        return configRepository.findByCompanyIdIsNull()
                .map(OrganizationConfig::getCurrency).orElse(null);
    }

    private void computeOverdue(ProjectPayment payment) {
        if (payment.getStatus() == ProjectPayment.PaymentStatus.PENDING
                && payment.getDueDate() != null
                && payment.getDueDate().isBefore(LocalDate.now())) {
            payment.setStatus(ProjectPayment.PaymentStatus.OVERDUE);
        }
    }
}