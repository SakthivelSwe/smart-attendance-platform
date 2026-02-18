package com.smartattendance.repository;

import com.smartattendance.entity.WhatsAppLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WhatsAppLogRepository extends JpaRepository<WhatsAppLog, Long> {
    List<WhatsAppLog> findByMappedFalse();

    List<WhatsAppLog> findBySenderAndMappedFalse(String sender);

    boolean existsBySenderAndDate(String sender, java.time.LocalDate date);
}
