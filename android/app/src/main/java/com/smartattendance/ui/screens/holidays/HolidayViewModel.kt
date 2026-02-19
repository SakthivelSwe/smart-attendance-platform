package com.smartattendance.ui.screens.holidays

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartattendance.data.model.Holiday
import com.smartattendance.data.repository.HolidayRepository
import com.smartattendance.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HolidayUiState(
    val isLoading: Boolean = true,
    val holidays: List<Holiday> = emptyList(),
    val error: String? = null,
    val formHoliday: Holiday? = null,
    val isFormLoading: Boolean = false,
    val formSuccess: Boolean = false,
    val formError: String? = null
)

@HiltViewModel
class HolidayViewModel @Inject constructor(
    private val holidayRepository: HolidayRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(HolidayUiState())
    val uiState: StateFlow<HolidayUiState> = _uiState.asStateFlow()

    init { loadHolidays() }

    fun loadHolidays() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            when (val result = holidayRepository.getAllHolidays()) {
                is NetworkResult.Success -> _uiState.update { it.copy(isLoading = false, holidays = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadHoliday(id: Long) {
        viewModelScope.launch {
            _uiState.update { it.copy(isFormLoading = true) }
            when (val result = holidayRepository.getHoliday(id)) {
                is NetworkResult.Success -> _uiState.update { it.copy(isFormLoading = false, formHoliday = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isFormLoading = false, formError = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun saveHoliday(holiday: Holiday) {
        viewModelScope.launch {
            _uiState.update { it.copy(isFormLoading = true, formError = null) }
            val result = if (holiday.id != null) holidayRepository.updateHoliday(holiday.id, holiday)
            else holidayRepository.createHoliday(holiday)
            when (result) {
                is NetworkResult.Success -> { _uiState.update { it.copy(isFormLoading = false, formSuccess = true) }; loadHolidays() }
                is NetworkResult.Error -> _uiState.update { it.copy(isFormLoading = false, formError = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun deleteHoliday(id: Long) {
        viewModelScope.launch {
            when (holidayRepository.deleteHoliday(id)) {
                is NetworkResult.Success -> loadHolidays()
                else -> {}
            }
        }
    }
}
