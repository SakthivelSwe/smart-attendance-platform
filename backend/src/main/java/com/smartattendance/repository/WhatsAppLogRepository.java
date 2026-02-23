package com.smartattendance.repository;

import com.smartattendance.entity.WhatsAppLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WhatsAppLogRepository extends JpaRepository<WhatsAppLog, Long> {
    List<WhatsAppLog> findByMappedFalse();

    List<WhatsAppLog> findBySenderAndMappedFalse(String sender);

    @org.springframework.data.jpa.repository.Query("SELECT w FROM WhatsAppLog w WHERE w.mapped = false AND (w.sender = :name OR w.sender = :waName OR w.sender LIKE %:phone%)")
    List<WhatsAppLog> findUnmappedPotentialMatches(@org.springframework.data.repository.query.Param("name") String name,
            @org.springframework.data.repository.query.Param("waName") String waName,
            @org.springframework.data.repository.query.Param("phone") String phone);

    boolean existsBySenderAndDate(String sender, java.time.LocalDate date);

    java.util.List<WhatsAppLog> findByDateBetween(java.time.LocalDate start, java.time.LocalDate end);
}
