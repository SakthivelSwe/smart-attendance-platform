package com.smartattendance.data.repository

import com.smartattendance.data.api.LeaveApi
import com.smartattendance.data.model.LeaveRequest
import com.smartattendance.util.NetworkResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LeaveRepository @Inject constructor(
    private val leaveApi: LeaveApi
) {
    suspend fun getAllLeaves(): NetworkResult<List<LeaveRequest>> = apiCall { leaveApi.getAllLeaves() }
    suspend fun getPendingLeaves(): NetworkResult<List<LeaveRequest>> = apiCall { leaveApi.getPendingLeaves() }
    suspend fun getByEmployee(employeeId: Long): NetworkResult<List<LeaveRequest>> = apiCall { leaveApi.getLeavesByEmployee(employeeId) }
    suspend fun applyLeave(leave: LeaveRequest): NetworkResult<LeaveRequest> = apiCall { leaveApi.applyLeave(leave) }

    suspend fun approveLeave(id: Long, remarks: String?): NetworkResult<LeaveRequest> {
        val body = mutableMapOf<String, String>()
        remarks?.let { body["remarks"] = it }
        return apiCall { leaveApi.approveLeave(id, body) }
    }

    suspend fun rejectLeave(id: Long, remarks: String?): NetworkResult<LeaveRequest> {
        val body = mutableMapOf<String, String>()
        remarks?.let { body["remarks"] = it }
        return apiCall { leaveApi.rejectLeave(id, body) }
    }
}
