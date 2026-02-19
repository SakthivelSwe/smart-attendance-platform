package com.smartattendance.data.repository

import com.smartattendance.data.api.SummaryApi
import com.smartattendance.data.model.MonthlySummary
import com.smartattendance.util.NetworkResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SummaryRepository @Inject constructor(
    private val summaryApi: SummaryApi
) {
    suspend fun getMonthlySummary(month: Int, year: Int): NetworkResult<List<MonthlySummary>> =
        apiCall { summaryApi.getMonthlySummary(month, year) }

    suspend fun generateSummary(month: Int, year: Int): NetworkResult<List<MonthlySummary>> =
        apiCall { summaryApi.generateSummary(month, year) }

    suspend fun getEmployeeSummary(employeeId: Long): NetworkResult<List<MonthlySummary>> =
        apiCall { summaryApi.getEmployeeSummary(employeeId) }
}
