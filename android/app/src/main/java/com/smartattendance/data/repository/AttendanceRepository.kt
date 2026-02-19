package com.smartattendance.data.repository

import com.smartattendance.data.api.AttendanceApi
import com.smartattendance.data.model.AttendanceRecord
import com.smartattendance.util.NetworkResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AttendanceRepository @Inject constructor(
    private val attendanceApi: AttendanceApi
) {
    suspend fun getByDate(date: String): NetworkResult<List<AttendanceRecord>> {
        return try {
            val response = attendanceApi.getByDate(date)
            if (response.isSuccessful) {
                NetworkResult.Success(response.body() ?: emptyList())
            } else {
                NetworkResult.Error("Failed to load attendance", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun processChat(chatText: String, date: String, groupId: Long?): NetworkResult<List<AttendanceRecord>> {
        return try {
            val request = mutableMapOf("chatText" to chatText, "date" to date)
            groupId?.let { request["groupId"] = it.toString() }
            val response = attendanceApi.processAttendance(request)
            if (response.isSuccessful) {
                NetworkResult.Success(response.body() ?: emptyList())
            } else {
                NetworkResult.Error("Failed to process chat", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun updateAttendance(id: Long, record: AttendanceRecord): NetworkResult<AttendanceRecord> {
        return try {
            val response = attendanceApi.updateAttendance(id, record)
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!)
            } else {
                NetworkResult.Error("Failed to update attendance", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }
}
