package com.smartattendance.ui.screens.groups

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartattendance.data.model.Group
import com.smartattendance.data.repository.GroupRepository
import com.smartattendance.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GroupUiState(
    val isLoading: Boolean = true,
    val groups: List<Group> = emptyList(),
    val error: String? = null,
    val formGroup: Group? = null,
    val isFormLoading: Boolean = false,
    val formSuccess: Boolean = false,
    val formError: String? = null
)

@HiltViewModel
class GroupViewModel @Inject constructor(
    private val groupRepository: GroupRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(GroupUiState())
    val uiState: StateFlow<GroupUiState> = _uiState.asStateFlow()

    init { loadGroups() }

    fun loadGroups() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            when (val result = groupRepository.getAllGroups()) {
                is NetworkResult.Success -> _uiState.update { it.copy(isLoading = false, groups = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadGroup(id: Long) {
        viewModelScope.launch {
            _uiState.update { it.copy(isFormLoading = true) }
            when (val result = groupRepository.getGroup(id)) {
                is NetworkResult.Success -> _uiState.update { it.copy(isFormLoading = false, formGroup = result.data) }
                is NetworkResult.Error -> _uiState.update { it.copy(isFormLoading = false, formError = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun saveGroup(group: Group) {
        viewModelScope.launch {
            _uiState.update { it.copy(isFormLoading = true, formError = null) }
            val result = if (group.id != null) groupRepository.updateGroup(group.id, group)
            else groupRepository.createGroup(group)
            when (result) {
                is NetworkResult.Success -> { _uiState.update { it.copy(isFormLoading = false, formSuccess = true) }; loadGroups() }
                is NetworkResult.Error -> _uiState.update { it.copy(isFormLoading = false, formError = result.message) }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun deleteGroup(id: Long) {
        viewModelScope.launch {
            when (groupRepository.deleteGroup(id)) {
                is NetworkResult.Success -> loadGroups()
                else -> {}
            }
        }
    }
}
