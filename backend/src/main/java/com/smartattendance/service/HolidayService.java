package com.smartattendance.service;

import com.smartattendance.dto.HolidayDTO;
import com.smartattendance.entity.Holiday;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;

    public List<HolidayDTO> getAllHolidays() {
        return holidayRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<HolidayDTO> getHolidaysByDateRange(LocalDate start, LocalDate end) {
        return holidayRepository.findByDateBetweenOrderByDateAsc(start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public HolidayDTO getHolidayById(Long id) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday", "id", id));
        return toDTO(holiday);
    }

    public boolean isHoliday(LocalDate date) {
        return holidayRepository.existsByDate(date);
    }

    @Transactional
    public HolidayDTO createHoliday(HolidayDTO dto) {
        if (holidayRepository.existsByDate(dto.getDate())) {
            throw new IllegalArgumentException("Holiday already exists for date: " + dto.getDate());
        }

        Holiday holiday = Holiday.builder()
                .date(dto.getDate())
                .name(dto.getName())
                .description(dto.getDescription())
                .isOptional(dto.getIsOptional() != null ? dto.getIsOptional() : false)
                .build();

        Holiday saved = holidayRepository.save(holiday);
        return toDTO(saved);
    }

    @Transactional
    public HolidayDTO updateHoliday(Long id, HolidayDTO dto) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday", "id", id));

        holiday.setDate(dto.getDate());
        holiday.setName(dto.getName());
        holiday.setDescription(dto.getDescription());
        holiday.setIsOptional(dto.getIsOptional());

        Holiday saved = holidayRepository.save(holiday);
        return toDTO(saved);
    }

    @Transactional
    public void deleteHoliday(Long id) {
        if (!holidayRepository.existsById(id)) {
            throw new ResourceNotFoundException("Holiday", "id", id);
        }
        holidayRepository.deleteById(id);
    }

    private HolidayDTO toDTO(Holiday holiday) {
        return HolidayDTO.builder()
                .id(holiday.getId())
                .date(holiday.getDate())
                .name(holiday.getName())
                .description(holiday.getDescription())
                .isOptional(holiday.getIsOptional())
                .build();
    }
}
