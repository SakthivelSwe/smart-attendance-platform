package com.smartattendance.data.api

import com.smartattendance.data.model.AttendanceRecord
import retrofit2.Response
import retrofit2.http.*

interface AttendanceApi {
    @GET("api/attendance/date/{date}")
    suspend fun getByDate(@Path("date") date: String): Response<List<AttendanceRecord>>

    @GET("api/attendance/employee/{employeeId}")
    suspend fun getByEmployee(@Path("employeeId") employeeId: Long): Response<List<AttendanceRecord>>

    @GET("api/attendance/range")
    suspend fun getByDateRange(
        @Query("start") start: String,
        @Query("end") end: String
    ): Response<List<AttendanceRecord>>

    @GET("api/attendance/employee/{employeeId}/range")
    suspend fun getByEmployeeAndRange(
        @Path("employeeId") employeeId: Long,
        @Query("start") start: String,
        @Query("end") end: String
    ): Response<List<AttendanceRecord>>

    @POST("api/attendance/process")
    suspend fun processAttendance(@Body request: Map<String, String>): Response<List<AttendanceRecord>>

    @PUT("api/attendance/{id}")
    suspend fun updateAttendance(
        @Path("id") id: Long,
        @Body dto: AttendanceRecord
    ): Response<AttendanceRecord>
}
