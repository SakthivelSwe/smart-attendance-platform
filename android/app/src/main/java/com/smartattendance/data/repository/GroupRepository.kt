package com.smartattendance.data.repository

import com.smartattendance.data.api.GroupApi
import com.smartattendance.data.model.Group
import com.smartattendance.util.NetworkResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GroupRepository @Inject constructor(
    private val groupApi: GroupApi
) {
    suspend fun getAllGroups(): NetworkResult<List<Group>> = apiCall { groupApi.getAllGroups() }
    suspend fun getActiveGroups(): NetworkResult<List<Group>> = apiCall { groupApi.getActiveGroups() }
    suspend fun getGroup(id: Long): NetworkResult<Group> = apiCall { groupApi.getGroup(id) }
    suspend fun createGroup(group: Group): NetworkResult<Group> = apiCall { groupApi.createGroup(group) }
    suspend fun updateGroup(id: Long, group: Group): NetworkResult<Group> = apiCall { groupApi.updateGroup(id, group) }

    suspend fun deleteGroup(id: Long): NetworkResult<Unit> {
        return try {
            val response = groupApi.deleteGroup(id)
            if (response.isSuccessful) NetworkResult.Success(Unit)
            else NetworkResult.Error("Failed to delete group", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }
}
