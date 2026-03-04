package com.smartattendance.repository;

import com.smartattendance.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    List<LeaveBalance> findByEmployeeIdAndYear(Long employeeId, Integer year);

    Optional<LeaveBalance> findByEmployeeIdAndYearAndLeaveType(Long employeeId, Integer year, String leaveType);
}
