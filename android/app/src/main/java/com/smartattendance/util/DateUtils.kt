package com.smartattendance.util

import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

object DateUtils {
    private val dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy")
    private val shortDateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    private val timeFormatter = DateTimeFormatter.ofPattern("hh:mm a")
    private val apiDateFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    fun formatDate(date: LocalDate): String = date.format(dateFormatter)
    fun formatShortDate(date: LocalDate): String = date.format(shortDateFormatter)
    fun formatTime(time: LocalTime?): String = time?.format(timeFormatter) ?: "—"
    fun formatApiDate(date: LocalDate): String = date.format(apiDateFormatter)
    fun parseApiDate(dateStr: String): LocalDate = LocalDate.parse(dateStr, apiDateFormatter)
}
