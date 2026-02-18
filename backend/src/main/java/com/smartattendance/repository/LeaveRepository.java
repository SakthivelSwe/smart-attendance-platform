package com.smartattendance.repository;

import com.smartattendance.entity.Leave;
import com.smartattendance.enums.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long> {

        @Query("SELECT l FROM Leave l JOIN FETCH l.employee e LEFT JOIN FETCH e.group")
        List<Leave> findAllWithEmployee();

        @Query("SELECT l FROM Leave l JOIN FETCH l.employee e LEFT JOIN FETCH e.group WHERE l.employee.id = :employeeId")
        List<Leave> findWithEmployeeByEmployeeId(@Param("employeeId") Long employeeId);

        @Query("SELECT l FROM Leave l JOIN FETCH l.employee e LEFT JOIN FETCH e.group WHERE l.status = :status")
        List<Leave> findWithEmployeeByStatus(@Param("status") LeaveStatus status);

        List<Leave> findByEmployeeId(Long employeeId);

        List<Leave> findByStatus(LeaveStatus status);

        List<Leave> findByEmployeeIdAndStatus(Long employeeId, LeaveStatus status);

        List<Leave> findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        Long employeeId, LocalDate endDate, LocalDate startDate);

        @Query("SELECT l FROM Leave l JOIN FETCH l.employee WHERE l.status = :status " +
                        "AND l.startDate <= :endDate AND l.endDate >= :startDate")
        List<Leave> findWithEmployeeByStatusAndDateRange(
                        @Param("status") LeaveStatus status,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        default List<Leave> findByEmployeeIdAndDateOverlap(Long employeeId, LocalDate date) {
                return findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                                employeeId, date, date);
        }

        default List<Leave> findWithEmployeeByStatusAndDateOverlap(LeaveStatus status, LocalDate date) {
                return findWithEmployeeByStatusAndDateRange(status, date, date);
        }
}
