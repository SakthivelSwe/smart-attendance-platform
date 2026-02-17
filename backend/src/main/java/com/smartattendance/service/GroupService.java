package com.smartattendance.service;

import com.smartattendance.dto.GroupDTO;
import com.smartattendance.entity.AttendanceGroup;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final EmployeeRepository employeeRepository;

    public List<GroupDTO> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<GroupDTO> getActiveGroups() {
        return groupRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public GroupDTO getGroupById(Long id) {
        AttendanceGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", id));
        return toDTO(group);
    }

    @Transactional
    public GroupDTO createGroup(GroupDTO dto) {
        if (groupRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Group with name '" + dto.getName() + "' already exists");
        }

        AttendanceGroup group = AttendanceGroup.builder()
                .name(dto.getName())
                .whatsappGroupName(dto.getWhatsappGroupName())
                .emailSubjectPattern(dto.getEmailSubjectPattern())
                .googleSheetId(dto.getGoogleSheetId())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        AttendanceGroup saved = groupRepository.save(group);
        return toDTO(saved);
    }

    @Transactional
    public GroupDTO updateGroup(Long id, GroupDTO dto) {
        AttendanceGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", id));

        group.setName(dto.getName());
        group.setWhatsappGroupName(dto.getWhatsappGroupName());
        group.setEmailSubjectPattern(dto.getEmailSubjectPattern());
        group.setGoogleSheetId(dto.getGoogleSheetId());
        group.setIsActive(dto.getIsActive());

        AttendanceGroup saved = groupRepository.save(group);
        return toDTO(saved);
    }

    @Transactional
    public void deleteGroup(Long id) {
        AttendanceGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", id));
        group.setIsActive(false);
        groupRepository.save(group);
    }

    private GroupDTO toDTO(AttendanceGroup group) {
        long employeeCount = employeeRepository.findByGroupId(group.getId()).size();

        return GroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .whatsappGroupName(group.getWhatsappGroupName())
                .emailSubjectPattern(group.getEmailSubjectPattern())
                .googleSheetId(group.getGoogleSheetId())
                .isActive(group.getIsActive())
                .employeeCount(employeeCount)
                .build();
    }
}
