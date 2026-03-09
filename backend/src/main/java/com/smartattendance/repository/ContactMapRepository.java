package com.smartattendance.repository;

import com.smartattendance.entity.ContactMapEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ContactMapRepository extends JpaRepository<ContactMapEntry, Long> {

    List<ContactMapEntry> findByGroupId(Long groupId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ContactMapEntry c WHERE c.group.id = :groupId")
    void deleteByGroupId(Long groupId);

    long countByGroupId(Long groupId);
}
