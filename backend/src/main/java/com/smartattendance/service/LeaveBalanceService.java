package com.smartattendance.service;

import com.smartattendance.entity.Employee;
import com.smartattendance.entity.LeaveBalance;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.LeaveBalanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveBalanceService {

    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;

    public List<LeaveBalance> getLeaveBalances(Long employeeId, Integer year) {
        return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year);
    }

    @Transactional
    public LeaveBalance initializeBalance(Long employeeId, Integer year, String leaveType, Double totalDays) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, year, leaveType)
                .orElseGet(() -> LeaveBalance.builder()
                        .employee(employee)
                        .year(year)
                        .leaveType(leaveType)
                        .usedDays(0.0)
                        .totalDays(totalDays)
                        .build());

        balance.setTotalDays(totalDays);
        return leaveBalanceRepository.save(balance);
    }

    @Transactional
    public void deductBalance(Long employeeId, Integer year, String leaveType, Double daysToDeduct) {
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, year, leaveType)
                .orElseThrow(() -> new IllegalArgumentException("No leave balance found for type: " + leaveType));

        if (balance.getRemainingDays() < daysToDeduct) {
            throw new IllegalArgumentException(
                    "Insufficient leave balance for " + leaveType + ". Available: " + balance.getRemainingDays());
        }

        balance.setUsedDays(balance.getUsedDays() + daysToDeduct);
        leaveBalanceRepository.save(balance);
    }

    @Transactional
    public void restoreBalance(Long employeeId, Integer year, String leaveType, Double daysToRestore) {
        leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, year, leaveType)
                .ifPresent(balance -> {
                    balance.setUsedDays(Math.max(0.0, balance.getUsedDays() - daysToRestore));
                    leaveBalanceRepository.save(balance);
                });
    }

    public boolean hasSufficientBalance(Long employeeId, Integer year, String leaveType, Double requiredDays) {
        return leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, year, leaveType)
                .map(b -> b.getRemainingDays() >= requiredDays)
                .orElse(false);
    }
}
