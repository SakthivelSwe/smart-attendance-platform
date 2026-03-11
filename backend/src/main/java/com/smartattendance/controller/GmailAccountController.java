package com.smartattendance.controller;

import com.smartattendance.dto.GmailAccountDTO;
import com.smartattendance.entity.AttendanceGroup;
import com.smartattendance.entity.GmailAccount;
import com.smartattendance.entity.User;
import com.smartattendance.repository.GmailAccountRepository;
import com.smartattendance.repository.GroupRepository;
import com.smartattendance.repository.UserRepository;
import com.smartattendance.service.GmailOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/gmail-accounts")
@RequiredArgsConstructor
public class GmailAccountController {

    private final GmailAccountRepository gmailAccountRepository;
    private final GroupRepository groupRepository;
    private final GmailOAuthService gmailOAuthService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<List<GmailAccountDTO>> getAccounts() {
        List<AttendanceGroup> groups = groupRepository.findAll();
        List<GmailAccountDTO> results = groups.stream().map(group -> {
            Optional<GmailAccount> optAccount = gmailAccountRepository.findByGroupId(group.getId());
            if (optAccount.isPresent()) {
                GmailAccount account = optAccount.get();
                return GmailAccountDTO.builder()
                        .id(account.getId())
                        .groupId(group.getId())
                        .groupName(group.getName())
                        .email(account.getEmail())
                        .authMethod(account.getAuthMethod())
                        .isActive(account.isActive())
                        .status(account.isActive() ? "Connected" : "Disconnected")
                        .build();
            } else {
                return GmailAccountDTO.builder()
                        .groupId(group.getId())
                        .groupName(group.getName())
                        .authMethod("NONE")
                        .isActive(false)
                        .status("Not Connected")
                        .build();
            }
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @PostMapping("/oauth/url")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<java.util.Map<String, String>> getOAuthUrl(
            @RequestBody java.util.Map<String, Object> payload) {
        Object groupIdObj = payload.get("groupId");
        if (groupIdObj == null) {
            return ResponseEntity.badRequest().build();
        }
        Long groupId = Long.valueOf(groupIdObj.toString());
        String url = gmailOAuthService.buildAuthorizationUrl(groupId);
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("url", url);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{groupId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<?> disconnectAccount(@PathVariable Long groupId) {
        gmailOAuthService.disconnect(groupId);
        return ResponseEntity.ok().build();
    }
}
