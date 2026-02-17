package com.smartattendance.repository;

import com.smartattendance.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByWhatsappName(String whatsappName);

    List<Employee> findByGroupId(Long groupId);

    List<Employee> findByIsActiveTrue();

    @Query("SELECT e FROM Employee e WHERE e.group.id = :groupId AND e.isActive = true")
    List<Employee> findActiveByGroupId(@Param("groupId") Long groupId);

    Optional<Employee> findByUserId(Long userId);

    boolean existsByEmail(String email);
}
