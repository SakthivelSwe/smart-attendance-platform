package com.smartattendance.ui.screens.leaves

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartattendance.data.local.TokenManager
import com.smartattendance.data.model.LeaveRequest
import com.smartattendance.data.repository.LeaveRepository
import com.smartattendance.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LeaveUiState(
    val isLoading: Boolean = true,
    val leaves: List<LeaveRequest> = emptyList(),
    val selectedTab: Int = 0,
    val error: String? = null,
    val isAdmin: Boolean = false,
    val actionInProgress: Boolean = false
)

@HiltViewModel
class LeaveViewModel @Inject constructor(
    private val leaveRepository: LeaveRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(LeaveUiState())
    val uiState: StateFlow<LeaveUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            tokenManager.userRole.collect { role ->
                _uiState.update { it.copy(isAdmin = role == "ADMIN") }
            }
        }
        loadLeaves()
    }

    fun loadLeaves() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = leaveRepository.getAllLeaves()) {
                is NetworkResult.Success -> _uiState.update { it.copy(isLoading = false, leaves = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun setTab(tab: Int) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    fun approveLeave(id: Long, remarks: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(actionInProgress = true) }
            when (leaveRepository.approveLeave(id, remarks)) {
                is NetworkResult.Success -> { _uiState.update { it.copy(actionInProgress = false) }; loadLeaves() }
                is NetworkResult.Error -> _uiState.update { it.copy(actionInProgress = false) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun rejectLeave(id: Long, remarks: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(actionInProgress = true) }
            when (leaveRepository.rejectLeave(id, remarks)) {
                is NetworkResult.Success -> { _uiState.update { it.copy(actionInProgress = false) }; loadLeaves() }
                is NetworkResult.Error -> _uiState.update { it.copy(actionInProgress = false) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    val filteredLeaves: StateFlow<List<LeaveRequest>> = _uiState.map { state ->
        when (state.selectedTab) {
            1 -> state.leaves.filter { it.status == "PENDING" }
            2 -> state.leaves.filter { it.status == "APPROVED" }
            3 -> state.leaves.filter { it.status == "REJECTED" }
            else -> state.leaves
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
}
