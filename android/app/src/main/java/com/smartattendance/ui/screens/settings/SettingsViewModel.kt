package com.smartattendance.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartattendance.data.local.TokenManager
import com.smartattendance.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val userName: String? = null,
    val userEmail: String? = null,
    val userRole: String? = null,
    val darkMode: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val tokenManager: TokenManager
) : ViewModel() {
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                tokenManager.userName,
                tokenManager.userEmail,
                tokenManager.userRole,
                tokenManager.darkMode
            ) { name, email, role, dark ->
                SettingsUiState(userName = name, userEmail = email, userRole = role, darkMode = dark)
            }.collect { _uiState.value = it }
        }
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }

    fun toggleDarkMode() {
        viewModelScope.launch {
            tokenManager.setDarkMode(!_uiState.value.darkMode)
        }
    }
}
