package com.smartattendance.service;

import com.smartattendance.dto.EmployeeDTO;
import com.smartattendance.entity.Employee;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.GroupRepository;
import com.smartattendance.repository.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private AttendanceService attendanceService;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee employee;
    private EmployeeDTO employeeDTO;

    @BeforeEach
    void setUp() {
        employee = Employee.builder()
                .id(1L)
                .name("John Doe")
                .email("john.doe@example.com")
                .isActive(true)
                .build();

        employeeDTO = EmployeeDTO.builder()
                .name("John Doe")
                .email("john.doe@example.com")
                .isActive(true)
                .build();
    }

    @Test
    void getEmployeeById_WhenEmployeeExists_ShouldReturnEmployeeDTO() {
        when(employeeRepository.findByIdWithGroup(1L)).thenReturn(Optional.of(employee));

        EmployeeDTO result = employeeService.getEmployeeById(1L);

        assertNotNull(result);
        assertEquals("John Doe", result.getName());
        assertEquals("john.doe@example.com", result.getEmail());
        verify(employeeRepository, times(1)).findByIdWithGroup(1L);
    }

    @Test
    void getEmployeeById_WhenEmployeeNotFound_ShouldThrowResourceNotFoundException() {
        when(employeeRepository.findByIdWithGroup(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> employeeService.getEmployeeById(1L));
        verify(employeeRepository, times(1)).findByIdWithGroup(1L);
    }

    @Test
    void createEmployee_WhenValidRequest_ShouldReturnCreatedEmployeeDTO() {
        when(employeeRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);

        EmployeeDTO result = employeeService.createEmployee(employeeDTO);

        assertNotNull(result);
        assertEquals("John Doe", result.getName());
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(attendanceService, times(1)).processUnmappedLogsForEmployee(any(Employee.class));
        verify(attendanceService, times(1)).ensureAttendanceForToday(any(Employee.class));
    }

    @Test
    void createEmployee_WhenEmailExists_ShouldThrowIllegalArgumentException() {
        when(employeeRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            employeeService.createEmployee(employeeDTO);
        });

        assertTrue(exception.getMessage().contains("already exists"));
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void deleteEmployee_WhenEmployeeExists_ShouldSoftDeleteEmployee() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        employeeService.deleteEmployee(1L);

        assertFalse(employee.getIsActive());
        verify(employeeRepository, times(1)).save(employee);
    }
}
