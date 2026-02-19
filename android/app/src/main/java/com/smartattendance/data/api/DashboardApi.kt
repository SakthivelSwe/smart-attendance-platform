package com.smartattendance.data.api

import com.smartattendance.data.model.DashboardStats
import retrofit2.Response
import retrofit2.http.GET

interface DashboardApi {
    @GET("api/dashboard/stats")
    suspend fun getDashboardStats(): Response<DashboardStats>
}
