package com.smartattendance.ui.screens.employees

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.smartattendance.data.model.Employee
import com.smartattendance.data.model.Group
import com.smartattendance.ui.components.LoadingView

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeeFormScreen(
    employeeId: Long?,
    onBack: () -> Unit,
    viewModel: EmployeeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isEdit = employeeId != null

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var employeeCode by remember { mutableStateOf("") }
    var whatsappName by remember { mutableStateOf("") }
    var selectedGroupId by remember { mutableStateOf<Long?>(null) }
    var isActive by remember { mutableStateOf(true) }
    var groupDropdownExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(employeeId) {
        employeeId?.let { viewModel.loadEmployee(it) }
    }

    LaunchedEffect(uiState.formEmployee) {
        uiState.formEmployee?.let { emp ->
            name = emp.name
            email = emp.email
            phone = emp.phone ?: ""
            employeeCode = emp.employeeCode ?: ""
            whatsappName = emp.whatsappName ?: ""
            selectedGroupId = emp.groupId
            isActive = emp.isActive ?: true
        }
    }

    LaunchedEffect(uiState.formSuccess) {
        if (uiState.formSuccess) onBack()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEdit) "Edit Employee" else "Add Employee", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isFormLoading && isEdit && uiState.formEmployee == null) {
            LoadingView(modifier = Modifier.padding(padding))
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = name, onValueChange = { name = it },
                    label = { Text("Name *") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    value = email, onValueChange = { email = it },
                    label = { Text("Email *") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    value = employeeCode, onValueChange = { employeeCode = it },
                    label = { Text("Employee Code") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    value = phone, onValueChange = { phone = it },
                    label = { Text("Phone") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    value = whatsappName, onValueChange = { whatsappName = it },
                    label = { Text("WhatsApp Name") },
                    supportingText = { Text("Must match WhatsApp display name exactly") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                // Group dropdown
                ExposedDropdownMenuBox(
                    expanded = groupDropdownExpanded,
                    onExpandedChange = { groupDropdownExpanded = it }
                ) {
                    OutlinedTextField(
                        value = uiState.groups.find { it.id == selectedGroupId }?.name ?: "Select Group",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Group") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(groupDropdownExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = groupDropdownExpanded,
                        onDismissRequest = { groupDropdownExpanded = false }
                    ) {
                        uiState.groups.forEach { group ->
                            DropdownMenuItem(
                                text = { Text(group.name) },
                                onClick = {
                                    selectedGroupId = group.id
                                    groupDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Active", style = MaterialTheme.typography.bodyLarge)
                    Switch(checked = isActive, onCheckedChange = { isActive = it })
                }

                uiState.formError?.let { error ->
                    Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }

                Button(
                    onClick = {
                        viewModel.saveEmployee(
                            Employee(
                                id = employeeId,
                                name = name,
                                email = email,
                                phone = phone.ifBlank { null },
                                employeeCode = employeeCode.ifBlank { null },
                                whatsappName = whatsappName.ifBlank { null },
                                groupId = selectedGroupId,
                                groupName = null,
                                isActive = isActive
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    enabled = name.isNotBlank() && email.isNotBlank() && !uiState.isFormLoading
                ) {
                    if (uiState.isFormLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(if (isEdit) "Update Employee" else "Create Employee")
                }
            }
        }
    }
}
