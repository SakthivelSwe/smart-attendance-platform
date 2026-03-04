package com.smartattendance.repository;

import com.smartattendance.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByName(String name);

    Optional<Team> findByTeamCode(String teamCode);

    List<Team> findByIsActiveTrue();

    @Query("SELECT t FROM Team t LEFT JOIN FETCH t.teamLead LEFT JOIN FETCH t.manager")
    List<Team> findAllWithLeadAndManager();

    @Query("SELECT t FROM Team t LEFT JOIN FETCH t.teamLead LEFT JOIN FETCH t.manager WHERE t.isActive = true")
    List<Team> findActiveWithLeadAndManager();

    @Query("SELECT t FROM Team t LEFT JOIN FETCH t.teamLead LEFT JOIN FETCH t.manager WHERE t.id = :id")
    Optional<Team> findByIdWithLeadAndManager(@Param("id") Long id);

    @Query("SELECT t FROM Team t LEFT JOIN FETCH t.teamLead LEFT JOIN FETCH t.manager WHERE t.teamLead.id = :userId")
    List<Team> findByTeamLeadId(@Param("userId") Long userId);

    @Query("SELECT t FROM Team t LEFT JOIN FETCH t.teamLead LEFT JOIN FETCH t.manager WHERE t.manager.id = :userId")
    List<Team> findByManagerId(@Param("userId") Long userId);

    boolean existsByName(String name);

    boolean existsByTeamCode(String teamCode);
}
