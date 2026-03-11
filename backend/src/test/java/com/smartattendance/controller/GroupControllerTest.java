package com.smartattendance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartattendance.dto.GroupDTO;
import com.smartattendance.security.JwtTokenProvider;
import com.smartattendance.repository.UserRepository;
import com.smartattendance.service.GroupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GroupController.class)
@AutoConfigureMockMvc(addFilters = false)
public class GroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private GroupService groupService;

    @Autowired
    private ObjectMapper objectMapper;

    private GroupDTO groupDTO;

    @BeforeEach
    void setUp() {
        groupDTO = GroupDTO.builder()
                .id(1L)
                .name("Engineering")
                .whatsappGroupName("Eng-Team")
                .isActive(true)
                .build();
    }

    @Test
    void getAllGroups_ShouldReturnListOfGroups() throws Exception {
        when(groupService.getAllGroups()).thenReturn(Arrays.asList(groupDTO));

        mockMvc.perform(get("/api/v1/groups")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Engineering"));
    }

    @Test
    void getGroupById_WhenValidId_ShouldReturnGroup() throws Exception {
        when(groupService.getGroupById(1L)).thenReturn(groupDTO);

        mockMvc.perform(get("/api/v1/groups/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Engineering"));
    }

    @Test
    void createGroup_WhenValidInput_ShouldReturnCreated() throws Exception {
        when(groupService.createGroup(any(GroupDTO.class))).thenReturn(groupDTO);

        mockMvc.perform(post("/api/v1/groups")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(groupDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Engineering"));
    }

    @Test
    void deleteGroup_ShouldReturnNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/groups/1"))
                .andExpect(status().isNoContent());
    }
}
