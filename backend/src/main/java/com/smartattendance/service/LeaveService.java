package com.smartattendance.service;

import com.smartattendance.dto.LeaveApprovalChainDTO;
import com.smartattendance.dto.LeaveDTO;
import com.smartattendance.entity.Employee;
import com.smartattendance.entity.Leave;
import com.smartattendance.entity.LeaveApprovalChain;
import com.smartattendance.entity.User;
import com.smartattendance.enums.LeaveStatus;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.LeaveApprovalChainRepository;
import com.smartattendance.repository.LeaveRepository;
import com.smartattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final LeaveApprovalChainRepository leaveApprovalChainRepository;
    private final LeaveBalanceService leaveBalanceService;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private NotificationEngineService notificationEngineService;

    public List<LeaveDTO> getAllLeaves() {
        return leaveRepository.findAllWithEmployee().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<LeaveDTO> getLeavesByEmployee(Long employeeId) {
        return leaveRepository.findWithEmployeeByEmployeeId(employeeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<LeaveDTO> getPendingLeaves() {
        return leaveRepository.findWithEmployeeByStatus(LeaveStatus.PENDING).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public boolean isOnApprovedLeave(Long employeeId, LocalDate date) {
        List<Leave> leaves = leaveRepository.findByEmployeeIdAndDateOverlap(employeeId, date);
        return leaves.stream().anyMatch(l -> l.getStatus() == LeaveStatus.APPROVED);
    }

    public java.util.Set<Long> getEmployeeIdsOnApprovedLeaveForDate(LocalDate date) {
        return leaveRepository.findWithEmployeeByStatusAndDateOverlap(LeaveStatus.APPROVED, date).stream()
                .map(l -> l.getEmployee().getId())
                .collect(Collectors.toSet());
    }

    public java.util.Map<LocalDate, java.util.Set<Long>> getEmployeeIdsOnApprovedLeaveForDateRange(LocalDate start,
            LocalDate end) {
        List<Leave> leaves = leaveRepository.findWithEmployeeByStatusAndDateRange(LeaveStatus.APPROVED, start, end);
        java.util.Map<LocalDate, java.util.Set<Long>> map = new java.util.HashMap<>();

        for (Leave leave : leaves) {
            LocalDate current = leave.getStartDate();
            while (!current.isAfter(leave.getEndDate()) && !current.isAfter(end)) {
                if (!current.isBefore(start)) {
                    map.computeIfAbsent(current, k -> new java.util.HashSet<>()).add(leave.getEmployee().getId());
                }
                current = current.plusDays(1);
            }
        }
        return map;
    }

    @Transactional
    public LeaveDTO applyLeave(LeaveDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", dto.getEmployeeId()));

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        // Validate Leave Balance
        double requiredDays = ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1.0;
        int currentYear = LocalDate.now().getYear();

        if (!leaveBalanceService.hasSufficientBalance(employee.getId(), currentYear, dto.getLeaveType(),
                requiredDays)) {
            throw new IllegalArgumentException("Insufficient leave balance for " + dto.getLeaveType());
        }

        Leave leave = Leave.builder()
                .employee(employee)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .leaveType(dto.getLeaveType())
                .status(LeaveStatus.PENDING)
                .build();

        Leave saved = leaveRepository.save(leave);

        // Deduct balance provisionally (it will be restored if rejected/cancelled)
        leaveBalanceService.deductBalance(employee.getId(), currentYear, dto.getLeaveType(), requiredDays);

        // Send email alert to TL/Manager
        notificationEngineService.sendLeaveRequestAlert(saved);

        return toDTO(saved);
    }

    @Transactional
    public LeaveDTO approveByTeamLead(Long leaveId, String adminEmail, String remarks) {
        Leave leave = getLeave(leaveId);
        User approver = getUserByEmail(adminEmail);

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Leave is " + leave.getStatus() + ", cannot be approved by Team Lead.");
        }

        leave.setStatus(LeaveStatus.TL_APPROVED);
        Leave saved = leaveRepository.save(leave);

        recordApprovalChain(saved, approver, "TEAM_LEAD", LeaveStatus.TL_APPROVED, remarks);

        notificationEngineService.sendLeaveStatusAlert(saved, "TL APPROVED", remarks);

        return toDTO(saved);
    }

    @Transactional
    public LeaveDTO approveByManager(Long leaveId, String adminEmail, String remarks) {
        Leave leave = getLeave(leaveId);
        User approver = getUserByEmail(adminEmail);

        if (leave.getStatus() != LeaveStatus.TL_APPROVED && leave.getStatus() != LeaveStatus.PENDING) {
            // Can approve via PENDING or TL_APPROVED
            throw new IllegalArgumentException("Leave is already " + leave.getStatus());
        }

        leave.setStatus(LeaveStatus.APPROVED);
        leave.setApprovedBy(approver.getId());
        leave.setAdminRemarks(remarks);
        Leave saved = leaveRepository.save(leave);

        recordApprovalChain(saved, approver, "MANAGER", LeaveStatus.APPROVED, remarks);

        notificationEngineService.sendLeaveStatusAlert(saved, "APPROVED", remarks);

        return toDTO(saved);
    }

    @Transactional
    public LeaveDTO rejectLeave(Long leaveId, String adminEmail, String remarks) {
        Leave leave = getLeave(leaveId);
        User approver = getUserByEmail(adminEmail);

        if (leave.getStatus() == LeaveStatus.APPROVED || leave.getStatus() == LeaveStatus.REJECTED
                || leave.getStatus() == LeaveStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot reject leave in status: " + leave.getStatus());
        }

        leave.setStatus(LeaveStatus.REJECTED);
        leave.setApprovedBy(approver.getId());
        leave.setAdminRemarks(remarks);
        Leave saved = leaveRepository.save(leave);

        recordApprovalChain(saved, approver, approver.getRole().name(), LeaveStatus.REJECTED, remarks);

        // Restore balance
        double requestedDays = ChronoUnit.DAYS.between(leave.getStartDate(), leave.getEndDate()) + 1.0;
        int currentYear = LocalDate.now().getYear();
        leaveBalanceService.restoreBalance(leave.getEmployee().getId(), currentYear, leave.getLeaveType(),
                requestedDays);

        notificationEngineService.sendLeaveStatusAlert(saved, "REJECTED", remarks);

        return toDTO(saved);
    }

    @Transactional
    public LeaveDTO cancelLeave(Long leaveId, String userEmail, String remarks) {
        Leave leave = getLeave(leaveId);
        User user = getUserByEmail(userEmail);

        if (leave.getStatus() == LeaveStatus.CANCELLED) {
            throw new IllegalArgumentException("Leave is already cancelled.");
        }

        leave.setStatus(LeaveStatus.CANCELLED);
        Leave saved = leaveRepository.save(leave);

        recordApprovalChain(saved, user, "EMPLOYEE", LeaveStatus.CANCELLED, remarks);

        // Restore balance
        double requestedDays = ChronoUnit.DAYS.between(leave.getStartDate(), leave.getEndDate()) + 1.0;
        int currentYear = LocalDate.now().getYear();
        leaveBalanceService.restoreBalance(leave.getEmployee().getId(), currentYear, leave.getLeaveType(),
                requestedDays);

        notificationEngineService.sendLeaveStatusAlert(saved, "CANCELLED", remarks);

        return toDTO(saved);
    }

    // --- Helpers ---

    private Leave getLeave(Long id) {
        return leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }

    private void recordApprovalChain(Leave leave, User approver, String role, LeaveStatus action, String remarks) {
        LeaveApprovalChain chain = LeaveApprovalChain.builder()
                .leave(leave)
                .approver(approver)
                .approverRole(role)
                .action(action)
                .remarks(remarks)
                .build();
        leaveApprovalChainRepository.save(chain);
    }

    private LeaveDTO toDTO(Leave leave) {
        String approvedByName = null;
        if (leave.getApprovedBy() != null) {
            approvedByName = userRepository.findById(leave.getApprovedBy())
                    .map(User::getName)
                    .orElse(null);
        }

        List<LeaveApprovalChainDTO> chainDTOs = leaveApprovalChainRepository
                .findByLeaveIdOrderByCreatedAtDesc(leave.getId()).stream()
                .map(this::toChainDTO)
                .collect(Collectors.toList());

        return LeaveDTO.builder()
                .id(leave.getId())
                .employeeId(leave.getEmployee().getId())
                .employeeName(leave.getEmployee().getName())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .reason(leave.getReason())
                .leaveType(leave.getLeaveType())
                .status(leave.getStatus())
                .approvedBy(leave.getApprovedBy())
                .approvedByName(approvedByName)
                .adminRemarks(leave.getAdminRemarks())
                .approvalChain(chainDTOs)
                .build();
    }

    private LeaveApprovalChainDTO toChainDTO(LeaveApprovalChain chain) {
        return LeaveApprovalChainDTO.builder()
                .id(chain.getId())
                .leaveId(chain.getLeave().getId())
                .approverId(chain.getApprover().getId())
                .approverName(chain.getApprover().getName())
                .approverRole(chain.getApproverRole())
                .action(chain.getAction())
                .remarks(chain.getRemarks())
                .createdAt(chain.getCreatedAt())
                .build();
    }

    // Keeps old signature for backward compatibility just in case but delegates
    @Transactional
    public LeaveDTO approveLeave(Long leaveId, Long adminUserId, String remarks) {
        User admin = userRepository.findById(adminUserId).orElseThrow();
        return approveByManager(leaveId, admin.getEmail(), remarks);
    }
}
