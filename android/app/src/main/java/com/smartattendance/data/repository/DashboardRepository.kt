package com.smartattendance.data.repository

import com.smartattendance.data.api.DashboardApi
import com.smartattendance.data.model.DashboardStats
import com.smartattendance.util.NetworkResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DashboardRepository @Inject constructor(
    private val dashboardApi: DashboardApi
) {
    suspend fun getDashboardStats(): NetworkResult<DashboardStats> {
        return try {
            val response = dashboardApi.getDashboardStats()
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!)
            } else {
                NetworkResult.Error("Failed to load dashboard", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }
}
