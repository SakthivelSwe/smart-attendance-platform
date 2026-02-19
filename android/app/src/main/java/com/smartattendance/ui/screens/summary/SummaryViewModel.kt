package com.smartattendance.ui.screens.summary

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartattendance.data.local.TokenManager
import com.smartattendance.data.model.MonthlySummary
import com.smartattendance.data.repository.SummaryRepository
import com.smartattendance.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class SummaryUiState(
    val isLoading: Boolean = true,
    val summaries: List<MonthlySummary> = emptyList(),
    val month: Int = LocalDate.now().monthValue,
    val year: Int = LocalDate.now().year,
    val error: String? = null,
    val isAdmin: Boolean = false,
    val isGenerating: Boolean = false
)

@HiltViewModel
class SummaryViewModel @Inject constructor(
    private val summaryRepository: SummaryRepository,
    private val tokenManager: TokenManager
) : ViewModel() {
    private val _uiState = MutableStateFlow(SummaryUiState())
    val uiState: StateFlow<SummaryUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch { tokenManager.userRole.collect { role -> _uiState.update { it.copy(isAdmin = role == "ADMIN") } } }
        loadSummary()
    }

    fun loadSummary() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = summaryRepository.getMonthlySummary(_uiState.value.month, _uiState.value.year)) {
                is NetworkResult.Success -> _uiState.update { it.copy(isLoading = false, summaries = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun setMonthYear(month: Int, year: Int) {
        _uiState.update { it.copy(month = month, year = year) }
        loadSummary()
    }

    fun generateSummary() {
        viewModelScope.launch {
            _uiState.update { it.copy(isGenerating = true) }
            when (val result = summaryRepository.generateSummary(_uiState.value.month, _uiState.value.year)) {
                is NetworkResult.Success -> {
                    _uiState.update { it.copy(isGenerating = false, summaries = result.data) }
                }
                is NetworkResult.Error -> _uiState.update { it.copy(isGenerating = false, error = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
