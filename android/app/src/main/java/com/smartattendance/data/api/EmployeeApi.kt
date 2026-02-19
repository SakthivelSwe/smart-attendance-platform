package com.smartattendance.data.api

import com.smartattendance.data.model.Employee
import retrofit2.Response
import retrofit2.http.*

interface EmployeeApi {
    @GET("api/employees")
    suspend fun getAllEmployees(): Response<List<Employee>>

    @GET("api/employees/active")
    suspend fun getActiveEmployees(): Response<List<Employee>>

    @GET("api/employees/{id}")
    suspend fun getEmployee(@Path("id") id: Long): Response<Employee>

    @GET("api/employees/group/{groupId}")
    suspend fun getEmployeesByGroup(@Path("groupId") groupId: Long): Response<List<Employee>>

    @POST("api/employees")
    suspend fun createEmployee(@Body dto: Employee): Response<Employee>

    @PUT("api/employees/{id}")
    suspend fun updateEmployee(@Path("id") id: Long, @Body dto: Employee): Response<Employee>

    @DELETE("api/employees/{id}")
    suspend fun deleteEmployee(@Path("id") id: Long): Response<Void>
}
