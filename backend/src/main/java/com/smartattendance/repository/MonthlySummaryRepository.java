package com.smartattendance.repository;

import com.smartattendance.entity.MonthlySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlySummaryRepository extends JpaRepository<MonthlySummary, Long> {

    @Query("SELECT m FROM MonthlySummary m JOIN FETCH m.employee e LEFT JOIN FETCH e.group WHERE m.employee.id = :employeeId AND m.month = :month AND m.year = :year")
    Optional<MonthlySummary> findByEmployeeIdAndMonthAndYear(
            @org.springframework.data.repository.query.Param("employeeId") Long employeeId,
            @org.springframework.data.repository.query.Param("month") Integer month,
            @org.springframework.data.repository.query.Param("year") Integer year);

    @Query("SELECT m FROM MonthlySummary m JOIN FETCH m.employee e LEFT JOIN FETCH e.group WHERE m.month = :month AND m.year = :year")
    List<MonthlySummary> findWithEmployeeByMonthAndYear(
            @org.springframework.data.repository.query.Param("month") Integer month,
            @org.springframework.data.repository.query.Param("year") Integer year);

    @Query("SELECT m FROM MonthlySummary m JOIN FETCH m.employee e LEFT JOIN FETCH e.group WHERE m.employee.id = :employeeId")
    List<MonthlySummary> findWithEmployeeByEmployeeId(
            @org.springframework.data.repository.query.Param("employeeId") Long employeeId);
}
