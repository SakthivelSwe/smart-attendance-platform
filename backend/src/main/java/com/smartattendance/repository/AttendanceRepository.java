package com.smartattendance.repository;

import com.smartattendance.entity.Attendance;
import com.smartattendance.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

        Optional<Attendance> findByEmployeeIdAndDate(Long employeeId, LocalDate date);

        @Query("SELECT a FROM Attendance a LEFT JOIN FETCH a.employee WHERE a.date = :date")
        List<Attendance> findWithEmployeeByDate(@Param("date") LocalDate date);

        @Query("SELECT a FROM Attendance a JOIN FETCH a.employee e LEFT JOIN FETCH e.group WHERE a.employee.id = :employeeId")
        List<Attendance> findWithEmployeeByEmployeeId(@Param("employeeId") Long employeeId);

        @Query("SELECT a FROM Attendance a JOIN FETCH a.employee e LEFT JOIN FETCH e.group WHERE a.employee.id = :employeeId "
                        +
                        "AND a.date >= :startDate AND a.date <= :endDate")
        List<Attendance> findWithEmployeeByEmployeeIdAndDateRange(@Param("employeeId") Long employeeId,
                        @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

        @Query("SELECT a FROM Attendance a JOIN FETCH a.employee e LEFT JOIN FETCH e.group WHERE a.date >= :startDate AND a.date <= :endDate")
        List<Attendance> findWithEmployeeByDateRange(@Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        List<Attendance> findByDate(LocalDate date);

        List<Attendance> findByEmployeeId(Long employeeId);

        List<Attendance> findByEmployeeIdAndDateBetween(Long employeeId, LocalDate startDate, LocalDate endDate);

        List<Attendance> findByDateBetween(LocalDate startDate, LocalDate endDate);

        @Query("SELECT COUNT(a) FROM Attendance a WHERE a.date = :date AND a.status = :status")
        long countByDateAndStatus(@Param("date") LocalDate date, @Param("status") AttendanceStatus status);

        @Query("SELECT COUNT(a) FROM Attendance a WHERE a.employee.id = :employeeId " +
                        "AND a.status = :status AND MONTH(a.date) = :month AND YEAR(a.date) = :year")
        long countByEmployeeAndStatusAndMonth(@Param("employeeId") Long employeeId,
                        @Param("status") AttendanceStatus status,
                        @Param("month") int month,
                        @Param("year") int year);

        boolean existsByEmployeeIdAndDate(Long employeeId, LocalDate date);
}
