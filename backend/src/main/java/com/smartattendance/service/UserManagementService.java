package com.smartattendance.service;

import com.smartattendance.dto.UserDTO;
import com.smartattendance.entity.User;
import com.smartattendance.enums.UserRole;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private static final Logger logger = LoggerFactory.getLogger(UserManagementService.class);

    private final UserRepository userRepository;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return toDTO(user);
    }

    /**
     * Admin assigns a role to a user.
     */
    @Transactional
    public UserDTO updateUserRole(Long userId, UserRole newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserRole oldRole = user.getRole();
        user.setRole(newRole);
        User saved = userRepository.save(user);

        logger.info("User role updated: {} ({}) from {} to {}", saved.getName(), saved.getEmail(), oldRole, newRole);
        return toDTO(saved);
    }

    /**
     * Admin activates/deactivates a user.
     */
    @Transactional
    public UserDTO updateUserStatus(Long userId, Boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setIsActive(isActive);
        User saved = userRepository.save(user);

        logger.info("User status updated: {} ({}) active={}", saved.getName(), saved.getEmail(), isActive);
        return toDTO(saved);
    }

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .emailVerified(user.isEmailVerified())
                .build();
    }
}
