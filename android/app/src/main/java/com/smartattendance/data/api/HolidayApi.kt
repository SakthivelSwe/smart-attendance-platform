package com.smartattendance.data.api

import com.smartattendance.data.model.Holiday
import retrofit2.Response
import retrofit2.http.*

interface HolidayApi {
    @GET("api/holidays")
    suspend fun getAllHolidays(): Response<List<Holiday>>

    @GET("api/holidays/range")
    suspend fun getHolidaysByRange(
        @Query("start") start: String,
        @Query("end") end: String
    ): Response<List<Holiday>>

    @GET("api/holidays/{id}")
    suspend fun getHoliday(@Path("id") id: Long): Response<Holiday>

    @POST("api/holidays")
    suspend fun createHoliday(@Body dto: Holiday): Response<Holiday>

    @PUT("api/holidays/{id}")
    suspend fun updateHoliday(@Path("id") id: Long, @Body dto: Holiday): Response<Holiday>

    @DELETE("api/holidays/{id}")
    suspend fun deleteHoliday(@Path("id") id: Long): Response<Void>
}
