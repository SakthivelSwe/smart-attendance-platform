package com.smartattendance.data.api

import com.smartattendance.data.model.LeaveRequest
import retrofit2.Response
import retrofit2.http.*

interface LeaveApi {
    @GET("api/leaves")
    suspend fun getAllLeaves(): Response<List<LeaveRequest>>

    @GET("api/leaves/pending")
    suspend fun getPendingLeaves(): Response<List<LeaveRequest>>

    @GET("api/leaves/employee/{employeeId}")
    suspend fun getLeavesByEmployee(@Path("employeeId") employeeId: Long): Response<List<LeaveRequest>>

    @POST("api/leaves")
    suspend fun applyLeave(@Body dto: LeaveRequest): Response<LeaveRequest>

    @PUT("api/leaves/{id}/approve")
    suspend fun approveLeave(
        @Path("id") id: Long,
        @Body body: Map<String, String>
    ): Response<LeaveRequest>

    @PUT("api/leaves/{id}/reject")
    suspend fun rejectLeave(
        @Path("id") id: Long,
        @Body body: Map<String, String>
    ): Response<LeaveRequest>
}
