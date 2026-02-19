package com.smartattendance.data.repository

import com.smartattendance.data.api.HolidayApi
import com.smartattendance.data.model.Holiday
import com.smartattendance.util.NetworkResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HolidayRepository @Inject constructor(
    private val holidayApi: HolidayApi
) {
    suspend fun getAllHolidays(): NetworkResult<List<Holiday>> = apiCall { holidayApi.getAllHolidays() }
    suspend fun getHoliday(id: Long): NetworkResult<Holiday> = apiCall { holidayApi.getHoliday(id) }
    suspend fun createHoliday(holiday: Holiday): NetworkResult<Holiday> = apiCall { holidayApi.createHoliday(holiday) }
    suspend fun updateHoliday(id: Long, holiday: Holiday): NetworkResult<Holiday> = apiCall { holidayApi.updateHoliday(id, holiday) }

    suspend fun deleteHoliday(id: Long): NetworkResult<Unit> {
        return try {
            val response = holidayApi.deleteHoliday(id)
            if (response.isSuccessful) NetworkResult.Success(Unit)
            else NetworkResult.Error("Failed to delete holiday", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }
}
