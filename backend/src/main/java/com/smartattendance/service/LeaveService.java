package com.smartattendance.service;

import com.smartattendance.dto.LeaveDTO;
import com.smartattendance.entity.Employee;
import com.smartattendance.entity.Leave;
import com.smartattendance.entity.User;
import com.smartattendance.enums.LeaveStatus;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.LeaveRepository;
import com.smartattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

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

    @Transactional
    public LeaveDTO applyLeave(LeaveDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", dto.getEmployeeId()));

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
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
        return toDTO(saved);
    }

    @Transactional
    public LeaveDTO approveLeave(Long leaveId, Long adminUserId, String remarks) {
        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", leaveId));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Leave is already " + leave.getStatus());
        }

        leave.setStatus(LeaveStatus.APPROVED);
        leave.setApprovedBy(adminUserId);
        leave.setAdminRemarks(remarks);

        Leave saved = leaveRepository.save(leave);
        return toDTO(saved);
    }

    @Transactional
    public LeaveDTO rejectLeave(Long leaveId, Long adminUserId, String remarks) {
        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", leaveId));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Leave is already " + leave.getStatus());
        }

        leave.setStatus(LeaveStatus.REJECTED);
        leave.setApprovedBy(adminUserId);
        leave.setAdminRemarks(remarks);

        Leave saved = leaveRepository.save(leave);
        return toDTO(saved);
    }

    private LeaveDTO toDTO(Leave leave) {
        String approvedByName = null;
        if (leave.getApprovedBy() != null) {
            approvedByName = userRepository.findById(leave.getApprovedBy())
                    .map(User::getName)
                    .orElse(null);
        }

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
                .build();
    }
}
