package com.nemo.expense;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.expense.ProjectExpense.ExpenseCategory;
import com.nemo.project.Project;
import com.nemo.project.ProjectRepository;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProjectExpenseService {

    private final ProjectExpenseRepository expenseRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectExpenseService(ProjectExpenseRepository expenseRepository,
                                  ProjectRepository projectRepository,
                                  UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public List<ProjectExpense> getByProjectId(Long projectId) {
        return expenseRepository.findByProjectIdOrderByExpenseDateDesc(projectId);
    }

    public ProjectExpense getById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProjectExpense", id));
    }

    @Transactional
    public ProjectExpense create(Long projectId, Long userId, ProjectExpenseDto.CreateRequest request, boolean autoApprove) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project", projectId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        ProjectExpense expense = new ProjectExpense();
        expense.setProject(project);
        expense.setCategory(ExpenseCategory.valueOf(request.category()));
        expense.setAmount(new BigDecimal(request.amount()));
        expense.setDescription(request.description());
        expense.setExpenseDate(java.time.LocalDate.parse(request.expenseDate()));
        expense.setCreatedBy(user);
        if (autoApprove) {
            expense.setApprovalStatus(ProjectExpense.ApprovalStatus.APPROVED);
            expense.setApprovedBy(user);
            expense.setApprovedAt(java.time.Instant.now());
        } else {
            expense.setApprovalStatus(ProjectExpense.ApprovalStatus.PENDING_REVIEW);
        }
        return expenseRepository.save(expense);
    }

    @Transactional
    public ProjectExpense update(Long id, ProjectExpenseDto.UpdateRequest request) {
        ProjectExpense expense = getById(id);
        if (request.category() != null) {
            expense.setCategory(ExpenseCategory.valueOf(request.category()));
        }
        if (request.amount() != null) {
            expense.setAmount(new BigDecimal(request.amount()));
        }
        if (request.description() != null) {
            expense.setDescription(request.description());
        }
        if (request.expenseDate() != null) {
            expense.setExpenseDate(java.time.LocalDate.parse(request.expenseDate()));
        }
        return expenseRepository.save(expense);
    }

    @Transactional
    public ProjectExpense approve(Long expenseId, Long approverId) {
        ProjectExpense expense = getById(expenseId);
        expense.setApprovalStatus(ProjectExpense.ApprovalStatus.APPROVED);
        expense.setApprovedBy(userRepository.findById(approverId).orElse(null));
        expense.setApprovedAt(java.time.Instant.now());
        expense.setRejectionReason(null);
        return expenseRepository.save(expense);
    }

    @Transactional
    public ProjectExpense reject(Long expenseId, Long approverId, String rejectionReason) {
        ProjectExpense expense = getById(expenseId);
        expense.setApprovalStatus(ProjectExpense.ApprovalStatus.REJECTED);
        expense.setApprovedBy(userRepository.findById(approverId).orElse(null));
        expense.setApprovedAt(java.time.Instant.now());
        expense.setRejectionReason(rejectionReason);
        return expenseRepository.save(expense);
    }

    @Transactional
    public void delete(Long id) {
        expenseRepository.deleteById(id);
    }
}