package com.smartattendance.repository;

import com.smartattendance.entity.AttendanceGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<AttendanceGroup, Long> {

    Optional<AttendanceGroup> findByName(String name);

    Optional<AttendanceGroup> findByWhatsappGroupName(String whatsappGroupName);

    List<AttendanceGroup> findByIsActiveTrue();

    boolean existsByName(String name);
}
