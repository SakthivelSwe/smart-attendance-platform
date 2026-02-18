package com.smartattendance.service;

import com.smartattendance.dto.EmployeeDTO;
import com.smartattendance.entity.AttendanceGroup;
import com.smartattendance.entity.Employee;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final GroupRepository groupRepository;
    private final AttendanceService attendanceService;

    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAllWithGroup().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EmployeeDTO> getActiveEmployees() {
        return employeeRepository.findByIsActiveTrueWithGroup().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findByIdWithGroup(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        return toDTO(employee);
    }

    public List<EmployeeDTO> getEmployeesByGroup(Long groupId) {
        return employeeRepository.findByGroupIdWithGroup(groupId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EmployeeDTO createEmployee(EmployeeDTO dto) {
        if (employeeRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Employee with email " + dto.getEmail() + " already exists");
        }

        Employee employee = Employee.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .whatsappName(dto.getWhatsappName())
                .employeeCode(dto.getEmployeeCode())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        if (dto.getGroupId() != null) {
            AttendanceGroup group = groupRepository.findById(dto.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group", "id", dto.getGroupId()));
            employee.setGroup(group);
        }

        Employee saved = employeeRepository.save(employee);

        // Match existing unmapped logs for this new employee
        attendanceService.processUnmappedLogsForEmployee(saved);

        // Ensure immediate feedback in daily list
        if (Boolean.TRUE.equals(saved.getIsActive())) {
            attendanceService.ensureAttendanceForToday(saved);
        }

        return toDTO(saved);
    }

    public EmployeeDTO updateEmployee(Long id, EmployeeDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        employee.setName(dto.getName());
        employee.setEmail(dto.getEmail());
        employee.setPhone(dto.getPhone());
        employee.setWhatsappName(dto.getWhatsappName());
        employee.setEmployeeCode(dto.getEmployeeCode());
        employee.setIsActive(dto.getIsActive());

        if (dto.getGroupId() != null) {
            AttendanceGroup group = groupRepository.findById(dto.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group", "id", dto.getGroupId()));
            employee.setGroup(group);
        } else {
            employee.setGroup(null);
        }

        Employee saved = employeeRepository.save(employee);

        // Re-match unmapped logs if name/phone changed
        attendanceService.processUnmappedLogsForEmployee(saved);

        // Ensure immediate feedback if reactivated
        if (Boolean.TRUE.equals(saved.getIsActive())) {
            attendanceService.ensureAttendanceForToday(saved);
        }

        return toDTO(saved);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        employee.setIsActive(false); // Soft delete
        employeeRepository.save(employee);
    }

    private EmployeeDTO toDTO(Employee employee) {
        return EmployeeDTO.builder()
                .id(employee.getId())
                .name(employee.getName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .whatsappName(employee.getWhatsappName())
                .employeeCode(employee.getEmployeeCode())
                .groupId(employee.getGroup() != null ? employee.getGroup().getId() : null)
                .groupName(employee.getGroup() != null ? employee.getGroup().getName() : null)
                .isActive(employee.getIsActive())
                .build();
    }
}
