package com.smartattendance.data.repository

import com.smartattendance.data.api.AuthApi
import com.smartattendance.data.local.TokenManager
import com.smartattendance.data.model.AuthRequest
import com.smartattendance.data.model.AuthResponse
import com.smartattendance.util.NetworkResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val tokenManager: TokenManager
) {
    val isLoggedIn = tokenManager.isLoggedIn
    val userRole = tokenManager.userRole
    val userName = tokenManager.userName
    val userEmail = tokenManager.userEmail
    val userAvatar = tokenManager.userAvatar

    suspend fun loginWithGoogle(idToken: String): NetworkResult<AuthResponse> {
        return try {
            val response = authApi.googleLogin(AuthRequest(credential = idToken))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                tokenManager.saveAuthData(
                    token = body.token,
                    userId = body.userId,
                    name = body.name,
                    email = body.email,
                    role = body.role,
                    avatarUrl = body.avatarUrl
                )
                NetworkResult.Success(body)
            } else {
                NetworkResult.Error(
                    message = response.errorBody()?.string() ?: "Login failed",
                    code = response.code()
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Network error")
        }
    }

    suspend fun getCurrentUser(): NetworkResult<AuthResponse> {
        return try {
            val response = authApi.getCurrentUser()
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!)
            } else {
                NetworkResult.Error("Failed to get user", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun logout() {
        tokenManager.clearAll()
    }
}
