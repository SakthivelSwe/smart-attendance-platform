package com.smartattendance.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartattendance.data.local.TokenManager
import com.smartattendance.data.model.DashboardStats
import com.smartattendance.data.repository.DashboardRepository
import com.smartattendance.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val isLoading: Boolean = true,
    val stats: DashboardStats? = null,
    val error: String? = null,
    val userName: String? = null,
    val userRole: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val dashboardRepository: DashboardRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
        viewModelScope.launch {
            combine(tokenManager.userName, tokenManager.userRole) { name, role ->
                name to role
            }.collect { (name, role) ->
                _uiState.update { it.copy(userName = name, userRole = role) }
            }
        }
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = dashboardRepository.getDashboardStats()) {
                is NetworkResult.Success -> _uiState.update { it.copy(isLoading = false, stats = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
