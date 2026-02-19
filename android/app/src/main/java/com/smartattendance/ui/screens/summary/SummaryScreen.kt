package com.smartattendance.ui.screens.summary

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
import com.smartattendance.data.model.MonthlySummary
import com.smartattendance.ui.components.*
import com.smartattendance.ui.theme.*
import java.time.Month
import java.time.format.TextStyle
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SummaryScreen(
    onBack: () -> Unit,
    viewModel: SummaryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showMonthPicker by remember { mutableStateOf(false) }

    val monthName = Month.of(uiState.month).getDisplayName(TextStyle.FULL, Locale.getDefault())

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Monthly Summary", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") } },
                actions = {
                    if (uiState.isAdmin) {
                        TextButton(
                            onClick = { viewModel.generateSummary() },
                            enabled = !uiState.isGenerating
                        ) {
                            if (uiState.isGenerating) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            else Text("Generate")
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Month/Year selector
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(12.dp),
                onClick = { showMonthPicker = true },
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Default.CalendarMonth, null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "$monthName ${uiState.year}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(Icons.Default.ArrowDropDown, null, modifier = Modifier.size(20.dp))
                }
            }

            when {
                uiState.isLoading -> LoadingView()
                uiState.error != null -> ErrorView(uiState.error!!, { viewModel.loadSummary() })
                uiState.summaries.isEmpty() -> EmptyView("No summary data for $monthName ${uiState.year}")
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.summaries) { summary ->
                            SummaryCard(summary)
                        }
                    }
                }
            }
        }
    }

    // Simple month/year picker dialog
    if (showMonthPicker) {
        AlertDialog(
            onDismissRequest = { showMonthPicker = false },
            title = { Text("Select Month") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Year selector
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center, modifier = Modifier.fillMaxWidth()) {
                        IconButton(onClick = { viewModel.setMonthYear(uiState.month, uiState.year - 1) }) { Icon(Icons.Default.ChevronLeft, "Prev year") }
                        Text("${uiState.year}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        IconButton(onClick = { viewModel.setMonthYear(uiState.month, uiState.year + 1) }) { Icon(Icons.Default.ChevronRight, "Next year") }
                    }
                    // Month grid (3x4)
                    for (row in 0..3) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            for (col in 0..2) {
                                val m = row * 3 + col + 1
                                val label = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.getDefault())
                                FilterChip(
                                    selected = m == uiState.month,
                                    onClick = { viewModel.setMonthYear(m, uiState.year); showMonthPicker = false },
                                    label = { Text(label, style = MaterialTheme.typography.labelSmall) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { showMonthPicker = false }) { Text("Close") } }
        )
    }
}

@Composable
private fun SummaryCard(summary: MonthlySummary) {
    Card(shape = RoundedCornerShape(12.dp), elevation = CardDefaults.cardElevation(1.dp)) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(summary.employeeName ?: "Unknown", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    Text(summary.employeeCode ?: "", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                summary.attendancePercentage?.let {
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = if (it >= 80) Emerald600.copy(alpha = 0.1f) else if (it >= 60) LeaveAmber.copy(alpha = 0.1f) else AbsentRed.copy(alpha = 0.1f)
                    ) {
                        Text(
                            "${String.format("%.1f", it)}%",
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (it >= 80) Emerald600 else if (it >= 60) LeaveAmber else AbsentRed
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                SummaryStatItem("WFO", "${summary.wfoCount ?: 0}", WfoGreen)
                SummaryStatItem("WFH", "${summary.wfhCount ?: 0}", WfhBlue)
                SummaryStatItem("Leave", "${summary.leaveCount ?: 0}", LeaveAmber)
                SummaryStatItem("Absent", "${summary.absentCount ?: 0}", AbsentRed)
            }
        }
    }
}

@Composable
private fun SummaryStatItem(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = color)
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
