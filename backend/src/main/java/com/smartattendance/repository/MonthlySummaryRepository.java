package com.smartattendance.repository;

import com.smartattendance.entity.MonthlySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlySummaryRepository extends JpaRepository<MonthlySummary, Long> {

    Optional<MonthlySummary> findByEmployeeIdAndMonthAndYear(Long employeeId, Integer month, Integer year);

    List<MonthlySummary> findByMonthAndYear(Integer month, Integer year);

    List<MonthlySummary> findByEmployeeId(Long employeeId);
}
