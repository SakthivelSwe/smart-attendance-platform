package com.smartattendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkTrendDTO {
    private LocalDate date;
    private long wfoCount;
    private long wfhCount;
    private long leaveCount;
}
