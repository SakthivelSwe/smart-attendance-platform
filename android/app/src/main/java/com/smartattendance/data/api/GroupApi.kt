package com.smartattendance.data.api

import com.smartattendance.data.model.Group
import retrofit2.Response
import retrofit2.http.*

interface GroupApi {
    @GET("api/groups")
    suspend fun getAllGroups(): Response<List<Group>>

    @GET("api/groups/active")
    suspend fun getActiveGroups(): Response<List<Group>>

    @GET("api/groups/{id}")
    suspend fun getGroup(@Path("id") id: Long): Response<Group>

    @POST("api/groups")
    suspend fun createGroup(@Body dto: Group): Response<Group>

    @PUT("api/groups/{id}")
    suspend fun updateGroup(@Path("id") id: Long, @Body dto: Group): Response<Group>

    @DELETE("api/groups/{id}")
    suspend fun deleteGroup(@Path("id") id: Long): Response<Void>
}
