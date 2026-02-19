package com.smartattendance.data.model

import com.google.gson.annotations.SerializedName

data class AuthRequest(
    val credential: String
)

data class AuthResponse(
    val token: String,
    val userId: Long,
    val email: String,
    val name: String,
    val avatarUrl: String?,
    val role: String
)

data class DashboardStats(
    val totalEmployees: Long,
    val presentToday: Long,
    val wfoToday: Long,
    val wfhToday: Long,
    val onLeaveToday: Long,
    val absentToday: Long,
    val pendingLeaves: Long,
    val upcomingHolidays: Long
)

data class AttendanceRecord(
    val id: Long?,
    val employeeId: Long?,
    val employeeName: String?,
    val employeeCode: String?,
    val date: String?,
    val inTime: String?,
    val outTime: String?,
    val status: String?,
    val source: String?,
    val remarks: String?,
    val groupName: String?
)

data class Employee(
    val id: Long?,
    val name: String,
    val email: String,
    val phone: String?,
    val whatsappName: String?,
    val employeeCode: String?,
    val groupId: Long?,
    val groupName: String?,
    @SerializedName("isActive")
    val isActive: Boolean?
)

data class Group(
    val id: Long?,
    val name: String,
    val whatsappGroupName: String?,
    val emailSubjectPattern: String?,
    val googleSheetId: String?,
    @SerializedName("isActive")
    val isActive: Boolean?,
    val employeeCount: Int?
)

data class Holiday(
    val id: Long?,
    val name: String,
    val date: String,
    val description: String?
)

data class LeaveRequest(
    val id: Long?,
    val employeeId: Long?,
    val employeeName: String?,
    val startDate: String,
    val endDate: String,
    val reason: String,
    val leaveType: String?,
    val status: String?,
    val approvedBy: Long?,
    val approvedByName: String?,
    val adminRemarks: String?
)

data class MonthlySummary(
    val id: Long?,
    val employeeId: Long?,
    val employeeName: String?,
    val employeeCode: String?,
    val groupName: String?,
    val month: Int?,
    val year: Int?,
    val wfoCount: Int?,
    val wfhCount: Int?,
    val leaveCount: Int?,
    val holidayCount: Int?,
    val absentCount: Int?,
    val totalWorkingDays: Int?,
    val attendancePercentage: Double?
)
