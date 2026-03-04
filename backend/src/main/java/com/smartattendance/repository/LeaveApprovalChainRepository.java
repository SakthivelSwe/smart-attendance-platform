package com.smartattendance.repository;

import com.smartattendance.entity.LeaveApprovalChain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveApprovalChainRepository extends JpaRepository<LeaveApprovalChain, Long> {
    List<LeaveApprovalChain> findByLeaveIdOrderByCreatedAtDesc(Long leaveId);
}
