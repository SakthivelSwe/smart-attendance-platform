package com.smartattendance.ui.screens.leaves

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
import com.smartattendance.data.model.LeaveRequest
import com.smartattendance.ui.components.*
import com.smartattendance.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveListScreen(
    viewModel: LeaveViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val filteredLeaves by viewModel.filteredLeaves.collectAsState()
    val tabs = listOf("All", "Pending", "Approved", "Rejected")

    Scaffold(
        topBar = { TopAppBar(title = { Text("Leave Management", fontWeight = FontWeight.Bold) }) }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            TabRow(selectedTabIndex = uiState.selectedTab) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = uiState.selectedTab == index,
                        onClick = { viewModel.setTab(index) },
                        text = { Text(title) }
                    )
                }
            }

            when {
                uiState.isLoading -> LoadingView()
                uiState.error != null -> ErrorView(uiState.error!!, onRetry = { viewModel.loadLeaves() })
                filteredLeaves.isEmpty() -> EmptyView("No leave requests")
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filteredLeaves) { leave ->
                            LeaveCard(
                                leave = leave,
                                isAdmin = uiState.isAdmin,
                                onApprove = { viewModel.approveLeave(leave.id!!, null) },
                                onReject = { viewModel.rejectLeave(leave.id!!, null) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LeaveCard(
    leave: LeaveRequest,
    isAdmin: Boolean,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    Card(shape = RoundedCornerShape(12.dp), elevation = CardDefaults.cardElevation(1.dp)) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(leave.employeeName ?: "Unknown", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    Text("${leave.startDate} → ${leave.endDate}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                StatusChip(status = leave.status ?: "PENDING")
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(leave.reason, style = MaterialTheme.typography.bodyMedium)
            leave.leaveType?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Type: $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            if (isAdmin && leave.status == "PENDING") {
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onReject,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = AbsentRed)
                    ) {
                        Icon(Icons.Default.Close, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Reject")
                    }
                    Button(
                        onClick = onApprove,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                    ) {
                        Icon(Icons.Default.Check, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Approve")
                    }
                }
            }
        }
    }
}
