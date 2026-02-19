package com.smartattendance.data.repository

import com.smartattendance.data.api.EmployeeApi
import com.smartattendance.data.model.Employee
import com.smartattendance.util.NetworkResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EmployeeRepository @Inject constructor(
    private val employeeApi: EmployeeApi
) {
    suspend fun getAllEmployees(): NetworkResult<List<Employee>> = apiCall { employeeApi.getAllEmployees() }
    suspend fun getActiveEmployees(): NetworkResult<List<Employee>> = apiCall { employeeApi.getActiveEmployees() }
    suspend fun getEmployee(id: Long): NetworkResult<Employee> = apiCall { employeeApi.getEmployee(id) }
    suspend fun getByGroup(groupId: Long): NetworkResult<List<Employee>> = apiCall { employeeApi.getEmployeesByGroup(groupId) }

    suspend fun createEmployee(employee: Employee): NetworkResult<Employee> = apiCall { employeeApi.createEmployee(employee) }
    suspend fun updateEmployee(id: Long, employee: Employee): NetworkResult<Employee> = apiCall { employeeApi.updateEmployee(id, employee) }

    suspend fun deleteEmployee(id: Long): NetworkResult<Unit> {
        return try {
            val response = employeeApi.deleteEmployee(id)
            if (response.isSuccessful) NetworkResult.Success(Unit)
            else NetworkResult.Error("Failed to delete employee", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }
}

// Helper to reduce boilerplate
internal suspend fun <T> apiCall(call: suspend () -> retrofit2.Response<T>): NetworkResult<T> {
    return try {
        val response = call()
        if (response.isSuccessful && response.body() != null) {
            NetworkResult.Success(response.body()!!)
        } else {
            NetworkResult.Error("Request failed", response.code())
        }
    } catch (e: Exception) {
        NetworkResult.Error(e.message ?: "Network error")
    }
}
