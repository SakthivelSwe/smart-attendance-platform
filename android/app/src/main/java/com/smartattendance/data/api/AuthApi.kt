package com.smartattendance.data.api

import com.smartattendance.data.model.AuthRequest
import com.smartattendance.data.model.AuthResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("api/auth/google")
    suspend fun googleLogin(@Body request: AuthRequest): Response<AuthResponse>

    @GET("api/auth/me")
    suspend fun getCurrentUser(): Response<AuthResponse>
}
