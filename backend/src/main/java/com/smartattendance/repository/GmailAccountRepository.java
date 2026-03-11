package com.smartattendance.repository;

import com.smartattendance.entity.GmailAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GmailAccountRepository extends JpaRepository<GmailAccount, Long> {

    Optional<GmailAccount> findByGroupId(Long groupId);

    List<GmailAccount> findByIsActiveTrue();
}
