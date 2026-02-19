package com.smartattendance.ui.screens.employees

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.smartattendance.data.model.Employee
import com.smartattendance.ui.components.*
import com.smartattendance.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeeListScreen(
    onAddEmployee: () -> Unit,
    onEditEmployee: (Long) -> Unit,
    viewModel: EmployeeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val filteredEmployees by viewModel.filteredEmployees.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Employees", fontWeight = FontWeight.Bold) },
                actions = {
                    Text(
                        "${uiState.employees.size} total",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(end = 16.dp)
                    )
                }
            )
        },
        floatingActionButton = {
            if (uiState.isAdmin) {
                ExtendedFloatingActionButton(
                    onClick = onAddEmployee,
                    icon = { Icon(Icons.Default.PersonAdd, "Add") },
                    text = { Text("Add Employee") }
                )
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Search bar
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.setSearchQuery(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                placeholder = { Text("Search employees...") },
                leadingIcon = { Icon(Icons.Default.Search, "Search") },
                trailingIcon = {
                    if (uiState.searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.setSearchQuery("") }) {
                            Icon(Icons.Default.Clear, "Clear")
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(16.dp)
            )

            when {
                uiState.isLoading -> LoadingView()
                uiState.error != null -> ErrorView(uiState.error!!, onRetry = { viewModel.loadEmployees() })
                filteredEmployees.isEmpty() -> EmptyView("No employees found")
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filteredEmployees) { employee ->
                            EmployeeCard(
                                employee = employee,
                                isAdmin = uiState.isAdmin,
                                onEdit = { employee.id?.let(onEditEmployee) },
                                onDelete = { employee.id?.let { viewModel.deleteEmployee(it) } }
                            )
                        }
                        item { Spacer(modifier = Modifier.height(80.dp)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun EmployeeCard(
    employee: Employee,
    isAdmin: Boolean,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    var showDeleteDialog by remember { mutableStateOf(false) }

    Card(
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(1.dp),
        onClick = { if (isAdmin) onEdit() }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Surface(
                modifier = Modifier.size(44.dp),
                shape = CircleShape,
                color = Indigo600.copy(alpha = 0.1f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = employee.name.take(2).uppercase(),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = Indigo600
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(employee.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                Text(employee.employeeCode ?: "", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(employee.groupName ?: "No group", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            if (employee.isActive == true) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Emerald600.copy(alpha = 0.1f)
                ) {
                    Text("Active", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, color = Emerald600)
                }
            }

            if (isAdmin) {
                IconButton(onClick = { showDeleteDialog = true }) {
                    Icon(Icons.Default.Delete, "Delete", tint = AbsentRed.copy(alpha = 0.6f), modifier = Modifier.size(20.dp))
                }
            }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Employee") },
            text = { Text("Are you sure you want to delete ${employee.name}?") },
            confirmButton = {
                TextButton(onClick = { onDelete(); showDeleteDialog = false }) {
                    Text("Delete", color = AbsentRed)
                }
            },
            dismissButton = { TextButton(onClick = { showDeleteDialog = false }) { Text("Cancel") } }
        )
    }
}
