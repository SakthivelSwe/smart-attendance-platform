package com.smartattendance.controller;

import com.smartattendance.dto.GroupDTO;
import com.smartattendance.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<List<GroupDTO>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/active")
    public ResponseEntity<List<GroupDTO>> getActiveGroups() {
        return ResponseEntity.ok(groupService.getActiveGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupDTO> getGroup(@PathVariable("id") Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GroupDTO> createGroup(@Valid @RequestBody GroupDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GroupDTO> updateGroup(@PathVariable("id") Long id, @Valid @RequestBody GroupDTO dto) {
        return ResponseEntity.ok(groupService.updateGroup(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGroup(@PathVariable("id") Long id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }
}
