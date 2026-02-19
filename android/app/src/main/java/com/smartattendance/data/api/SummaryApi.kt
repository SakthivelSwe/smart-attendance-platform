package com.smartattendance.data.api

import com.smartattendance.data.model.MonthlySummary
import retrofit2.Response
import retrofit2.http.*

interface SummaryApi {
    @GET("api/summary/monthly")
    suspend fun getMonthlySummary(
        @Query("month") month: Int,
        @Query("year") year: Int
    ): Response<List<MonthlySummary>>

    @GET("api/summary/employee/{employeeId}")
    suspend fun getEmployeeSummary(@Path("employeeId") employeeId: Long): Response<List<MonthlySummary>>

    @POST("api/summary/generate")
    suspend fun generateSummary(
        @Query("month") month: Int,
        @Query("year") year: Int
    ): Response<List<MonthlySummary>>
}
