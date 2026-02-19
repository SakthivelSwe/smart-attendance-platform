package com.smartattendance.ui.screens.holidays

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.smartattendance.data.model.Holiday
import com.smartattendance.ui.components.*
import com.smartattendance.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HolidayListScreen(
    onAddHoliday: () -> Unit,
    onEditHoliday: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: HolidayViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Holidays", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") } }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddHoliday) { Icon(Icons.Default.Add, "Add Holiday") }
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingView(modifier = Modifier.padding(padding))
            uiState.error != null -> ErrorView(uiState.error!!, { viewModel.loadHolidays() }, Modifier.padding(padding))
            uiState.holidays.isEmpty() -> EmptyView("No holidays", Modifier.padding(padding))
            else -> {
                LazyColumn(
                    modifier = Modifier.padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.holidays) { holiday ->
                        HolidayCard(holiday, onEdit = { holiday.id?.let(onEditHoliday) }, onDelete = { holiday.id?.let(viewModel::deleteHoliday) })
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }
}

@Composable
private fun HolidayCard(holiday: Holiday, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(shape = RoundedCornerShape(12.dp), onClick = onEdit, elevation = CardDefaults.cardElevation(1.dp)) {
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Celebration, null, tint = HolidayPurple, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(holiday.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                Text(holiday.date, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                holiday.description?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                }
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, "Delete", tint = AbsentRed.copy(alpha = 0.6f), modifier = Modifier.size(20.dp))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HolidayFormScreen(holidayId: Long?, onBack: () -> Unit, viewModel: HolidayViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    val isEdit = holidayId != null
    var name by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var showDatePicker by remember { mutableStateOf(false) }

    LaunchedEffect(holidayId) { holidayId?.let { viewModel.loadHoliday(it) } }
    LaunchedEffect(uiState.formHoliday) { uiState.formHoliday?.let { name = it.name; date = it.date; description = it.description ?: "" } }
    LaunchedEffect(uiState.formSuccess) { if (uiState.formSuccess) onBack() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEdit) "Edit Holiday" else "Add Holiday", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") } }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Holiday Name *") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(
                value = date, onValueChange = { date = it },
                label = { Text("Date (YYYY-MM-DD) *") },
                trailingIcon = { IconButton(onClick = { showDatePicker = true }) { Icon(Icons.Default.CalendarMonth, "Pick date") } },
                modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)
            )
            OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("Description") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), minLines = 2)
            Button(
                onClick = { viewModel.saveHoliday(Holiday(id = holidayId, name = name, date = date, description = description.ifBlank { null })) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                enabled = name.isNotBlank() && date.isNotBlank() && !uiState.isFormLoading
            ) {
                if (uiState.isFormLoading) { CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp); Spacer(modifier = Modifier.width(8.dp)) }
                Text(if (isEdit) "Update Holiday" else "Create Holiday")
            }
        }
    }

    if (showDatePicker) {
        val pickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    pickerState.selectedDateMillis?.let { millis ->
                        val ld = java.time.LocalDate.ofEpochDay(millis / 86400000)
                        date = ld.toString()
                    }
                    showDatePicker = false
                }) { Text("OK") }
            },
            dismissButton = { TextButton(onClick = { showDatePicker = false }) { Text("Cancel") } }
        ) { DatePicker(state = pickerState) }
    }
}
