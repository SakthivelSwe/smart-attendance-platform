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

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.group WHERE e.id = :id")
    Optional<Employee> findByIdWithGroup(@Param("id") Long id);

    Optional<Employee> findByWhatsappName(String whatsappName);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.group")
    List<Employee> findAllWithGroup();

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.group WHERE e.isActive = true")
    List<Employee> findByIsActiveTrueWithGroup();

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.group WHERE e.group.id = :groupId")
    List<Employee> findByGroupIdWithGroup(@Param("groupId") Long groupId);

    List<Employee> findByGroupId(Long groupId);

    List<Employee> findByIsActiveTrue();

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.group WHERE e.group.id = :groupId AND e.isActive = true")
    List<Employee> findActiveByGroupIdWithGroup(@Param("groupId") Long groupId);

    List<Employee> findActiveByGroupId(@Param("groupId") Long groupId);

    Optional<Employee> findByUserId(Long userId);

    boolean existsByEmail(String email);
}
