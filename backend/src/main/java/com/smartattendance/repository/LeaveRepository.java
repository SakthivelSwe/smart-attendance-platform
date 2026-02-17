package com.smartattendance.repository;

import com.smartattendance.entity.Leave;
import com.smartattendance.enums.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long> {

    List<Leave> findByEmployeeId(Long employeeId);

    List<Leave> findByStatus(LeaveStatus status);

    List<Leave> findByEmployeeIdAndStatus(Long employeeId, LeaveStatus status);

    List<Leave> findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long employeeId, LocalDate endDate, LocalDate startDate);

    default List<Leave> findByEmployeeIdAndDateOverlap(Long employeeId, LocalDate date) {
        return findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                employeeId, date, date);
    }
}
