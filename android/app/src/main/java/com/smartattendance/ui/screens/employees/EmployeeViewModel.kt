package com.smartattendance.ui.screens.employees

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartattendance.data.local.TokenManager
import com.smartattendance.data.model.Employee
import com.smartattendance.data.model.Group
import com.smartattendance.data.repository.EmployeeRepository
import com.smartattendance.data.repository.GroupRepository
import com.smartattendance.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EmployeeUiState(
    val isLoading: Boolean = true,
    val employees: List<Employee> = emptyList(),
    val groups: List<Group> = emptyList(),
    val searchQuery: String = "",
    val error: String? = null,
    val isAdmin: Boolean = false,
    // Form state
    val formEmployee: Employee? = null,
    val isFormLoading: Boolean = false,
    val formSuccess: Boolean = false,
    val formError: String? = null
)

@HiltViewModel
class EmployeeViewModel @Inject constructor(
    private val employeeRepository: EmployeeRepository,
    private val groupRepository: GroupRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(EmployeeUiState())
    val uiState: StateFlow<EmployeeUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            tokenManager.userRole.collect { role ->
                _uiState.update { it.copy(isAdmin = role == "ADMIN") }
            }
        }
        loadEmployees()
        loadGroups()
    }

    fun loadEmployees() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = employeeRepository.getAllEmployees()) {
                is NetworkResult.Success -> _uiState.update { it.copy(isLoading = false, employees = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    private fun loadGroups() {
        viewModelScope.launch {
            when (val result = groupRepository.getActiveGroups()) {
                is NetworkResult.Success -> _uiState.update { it.copy(groups = result.data) }
                else -> {}
            }
        }
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun loadEmployee(id: Long) {
        viewModelScope.launch {
            _uiState.update { it.copy(isFormLoading = true) }
            when (val result = employeeRepository.getEmployee(id)) {
                is NetworkResult.Success -> _uiState.update { it.copy(isFormLoading = false, formEmployee = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isFormLoading = false, formError = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun saveEmployee(employee: Employee) {
        viewModelScope.launch {
            _uiState.update { it.copy(isFormLoading = true, formError = null) }
            val result = if (employee.id != null) {
                employeeRepository.updateEmployee(employee.id, employee)
            } else {
                employeeRepository.createEmployee(employee)
            }
            when (result) {
                is NetworkResult.Success -> {
                    _uiState.update { it.copy(isFormLoading = false, formSuccess = true) }
                    loadEmployees()
                }
                is NetworkResult.Error -> _uiState.update { it.copy(isFormLoading = false, formError = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun deleteEmployee(id: Long) {
        viewModelScope.launch {
            when (employeeRepository.deleteEmployee(id)) {
                is NetworkResult.Success -> loadEmployees()
                else -> {}
            }
        }
    }

    val filteredEmployees: StateFlow<List<Employee>> = _uiState.map { state ->
        if (state.searchQuery.isBlank()) state.employees
        else state.employees.filter {
            it.name.contains(state.searchQuery, ignoreCase = true) ||
            (it.employeeCode?.contains(state.searchQuery, ignoreCase = true) == true) ||
            it.email.contains(state.searchQuery, ignoreCase = true)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
}
