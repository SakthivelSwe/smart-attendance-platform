package com.smartattendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolidayDTO {
    private Long id;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotBlank(message = "Holiday name is required")
    private String name;

    private String description;

    @JsonProperty("isOptional")
    private Boolean isOptional;
}
