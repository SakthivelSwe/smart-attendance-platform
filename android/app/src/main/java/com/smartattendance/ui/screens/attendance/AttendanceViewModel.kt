package com.smartattendance.ui.screens.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartattendance.data.local.TokenManager
import com.smartattendance.data.model.AttendanceRecord
import com.smartattendance.data.repository.AttendanceRepository
import com.smartattendance.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

data class AttendanceUiState(
    val isLoading: Boolean = true,
    val records: List<AttendanceRecord> = emptyList(),
    val selectedDate: LocalDate = LocalDate.now(),
    val selectedFilter: String = "All",
    val error: String? = null,
    val isAdmin: Boolean = false,
    val isProcessing: Boolean = false,
    val processSuccess: Boolean = false
)

@HiltViewModel
class AttendanceViewModel @Inject constructor(
    private val attendanceRepository: AttendanceRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(AttendanceUiState())
    val uiState: StateFlow<AttendanceUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            tokenManager.userRole.collect { role ->
                _uiState.update { it.copy(isAdmin = role == "ADMIN") }
            }
        }
        loadAttendance()
    }

    fun setDate(date: LocalDate) {
        _uiState.update { it.copy(selectedDate = date) }
        loadAttendance()
    }

    fun setFilter(filter: String) {
        _uiState.update { it.copy(selectedFilter = filter) }
    }

    fun loadAttendance() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val dateStr = _uiState.value.selectedDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
            when (val result = attendanceRepository.getByDate(dateStr)) {
                is NetworkResult.Success -> _uiState.update { it.copy(isLoading = false, records = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun processChat(chatText: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true) }
            val dateStr = _uiState.value.selectedDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
            when (val result = attendanceRepository.processChat(chatText, dateStr, null)) {
                is NetworkResult.Success -> {
                    _uiState.update { it.copy(isProcessing = false, processSuccess = true) }
                    loadAttendance()
                }
                is NetworkResult.Error -> _uiState.update { it.copy(isProcessing = false, error = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun clearProcessSuccess() {
        _uiState.update { it.copy(processSuccess = false) }
    }

    val filteredRecords: StateFlow<List<AttendanceRecord>> = _uiState.map { state ->
        when (state.selectedFilter) {
            "WFO" -> state.records.filter { it.status == "WFO" }
            "WFH" -> state.records.filter { it.status == "WFH" }
            "Leave" -> state.records.filter { it.status == "LEAVE" }
            "Absent" -> state.records.filter { it.status == "ABSENT" }
            else -> state.records
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
}
