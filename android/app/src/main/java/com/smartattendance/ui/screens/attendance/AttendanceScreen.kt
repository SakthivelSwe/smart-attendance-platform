package com.smartattendance.ui.screens.attendance

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.smartattendance.data.model.AttendanceRecord
import com.smartattendance.ui.components.*
import com.smartattendance.util.DateUtils
import java.time.LocalDate
import java.time.LocalTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceScreen(
    viewModel: AttendanceViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val filteredRecords by viewModel.filteredRecords.collectAsState()
    var showProcessDialog by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }

    val filters = listOf("All", "WFO", "WFH", "Leave", "Absent")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Attendance", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { showDatePicker = true }) {
                        Icon(Icons.Default.CalendarMonth, "Select date")
                    }
                }
            )
        },
        floatingActionButton = {
            if (uiState.isAdmin) {
                ExtendedFloatingActionButton(
                    onClick = { showProcessDialog = true },
                    icon = { Icon(Icons.Default.Chat, "Process") },
                    text = { Text("Process Chat") }
                )
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Date display
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Selected Date", style = MaterialTheme.typography.labelSmall)
                        Text(
                            DateUtils.formatDate(uiState.selectedDate),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Text(
                        "${filteredRecords.size} records",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            // Filter chips
            ScrollableTabRow(
                selectedTabIndex = filters.indexOf(uiState.selectedFilter),
                modifier = Modifier.padding(horizontal = 8.dp),
                edgePadding = 8.dp,
                divider = {}
            ) {
                filters.forEach { filter ->
                    Tab(
                        selected = uiState.selectedFilter == filter,
                        onClick = { viewModel.setFilter(filter) },
                        text = {
                            val count = when (filter) {
                                "WFO" -> uiState.records.count { it.status == "WFO" }
                                "WFH" -> uiState.records.count { it.status == "WFH" }
                                "Leave" -> uiState.records.count { it.status == "LEAVE" }
                                "Absent" -> uiState.records.count { it.status == "ABSENT" }
                                else -> uiState.records.size
                            }
                            Text("$filter ($count)")
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Content
            when {
                uiState.isLoading -> LoadingView()
                uiState.error != null -> ErrorView(uiState.error!!, onRetry = { viewModel.loadAttendance() })
                filteredRecords.isEmpty() -> EmptyView("No attendance records for this date")
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filteredRecords) { record ->
                            AttendanceCard(record)
                        }
                    }
                }
            }
        }
    }

    // Process Chat Dialog
    if (showProcessDialog) {
        ProcessChatDialog(
            isProcessing = uiState.isProcessing,
            onDismiss = { showProcessDialog = false },
            onProcess = { chatText ->
                viewModel.processChat(chatText)
                showProcessDialog = false
            }
        )
    }

    // Date Picker
    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = uiState.selectedDate.toEpochDay() * 86400000
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        viewModel.setDate(LocalDate.ofEpochDay(millis / 86400000))
                    }
                    showDatePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    // Success snackbar
    LaunchedEffect(uiState.processSuccess) {
        if (uiState.processSuccess) viewModel.clearProcessSuccess()
    }
}

@Composable
private fun AttendanceCard(record: AttendanceRecord) {
    Card(
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    record.employeeName ?: "Unknown",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    record.employeeCode ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (record.inTime != null || record.outTime != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "In: ${record.inTime ?: "—"}  Out: ${record.outTime ?: "—"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            StatusChip(status = record.status ?: "ABSENT")
        }
    }
}

@Composable
fun ProcessChatDialog(
    isProcessing: Boolean,
    onDismiss: () -> Unit,
    onProcess: (String) -> Unit
) {
    var chatText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Process WhatsApp Chat", fontWeight = FontWeight.Bold) },
        text = {
            Column {
                Text(
                    "Paste your exported WhatsApp chat text below:",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = chatText,
                    onValueChange = { chatText = it },
                    modifier = Modifier.fillMaxWidth().height(200.dp),
                    placeholder = { Text("DD/MM/YYYY, HH:MM - Name: WFO/WFH/Leave") },
                    shape = RoundedCornerShape(12.dp)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onProcess(chatText) },
                enabled = chatText.isNotBlank() && !isProcessing
            ) {
                if (isProcessing) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text("Process")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
