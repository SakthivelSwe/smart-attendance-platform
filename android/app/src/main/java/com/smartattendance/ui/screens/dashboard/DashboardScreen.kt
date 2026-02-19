package com.smartattendance.ui.screens.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.smartattendance.data.model.DashboardStats
import com.smartattendance.ui.components.*
import com.smartattendance.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToGroups: () -> Unit,
    onNavigateToHolidays: () -> Unit,
    onNavigateToSummary: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Welcome back,",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = uiState.userName ?: "User",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                actions = {
                    if (uiState.userRole == "ADMIN") {
                        BadgedBox(
                            badge = { Badge { } }
                        ) {
                            IconButton(onClick = {}) {
                                Icon(Icons.Outlined.Notifications, contentDescription = "Notifications")
                            }
                        }
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingView(modifier = Modifier.padding(padding))
            uiState.error != null -> ErrorView(
                message = uiState.error!!,
                onRetry = { viewModel.loadDashboard() },
                modifier = Modifier.padding(padding)
            )
            uiState.stats != null -> {
                val stats = uiState.stats!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 16.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    Spacer(modifier = Modifier.height(8.dp))

                    // Stats Grid
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatsCard(
                            title = "Total Employees",
                            value = "${stats.totalEmployees}",
                            icon = Icons.Filled.People,
                            color = Indigo600,
                            modifier = Modifier.weight(1f)
                        )
                        StatsCard(
                            title = "Present Today",
                            value = "${stats.presentToday}",
                            icon = Icons.Filled.CheckCircle,
                            color = Emerald600,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatsCard(
                            title = "WFO Today",
                            value = "${stats.wfoToday}",
                            icon = Icons.Filled.Business,
                            color = WfoGreen,
                            modifier = Modifier.weight(1f)
                        )
                        StatsCard(
                            title = "WFH Today",
                            value = "${stats.wfhToday}",
                            icon = Icons.Filled.Home,
                            color = WfhBlue,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatsCard(
                            title = "On Leave",
                            value = "${stats.onLeaveToday}",
                            icon = Icons.Filled.BeachAccess,
                            color = LeaveAmber,
                            modifier = Modifier.weight(1f)
                        )
                        StatsCard(
                            title = "Absent",
                            value = "${stats.absentToday}",
                            icon = Icons.Filled.PersonOff,
                            color = AbsentRed,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Quick Actions (Admin only)
                    if (uiState.userRole == "ADMIN") {
                        Text(
                            text = "Quick Actions",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            QuickActionCard(
                                icon = Icons.Filled.Groups,
                                label = "Groups",
                                onClick = onNavigateToGroups,
                                modifier = Modifier.weight(1f)
                            )
                            QuickActionCard(
                                icon = Icons.Filled.CalendarMonth,
                                label = "Holidays",
                                onClick = onNavigateToHolidays,
                                modifier = Modifier.weight(1f)
                            )
                            QuickActionCard(
                                icon = Icons.Filled.Assessment,
                                label = "Summary",
                                onClick = onNavigateToSummary,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // Pending Info
                    if (stats.pendingLeaves > 0 || stats.upcomingHolidays > 0) {
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "Notifications",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        if (stats.pendingLeaves > 0) {
                            NotificationCard(
                                icon = Icons.Filled.PendingActions,
                                text = "${stats.pendingLeaves} pending leave request(s)",
                                color = LeaveAmber
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        if (stats.upcomingHolidays > 0) {
                            NotificationCard(
                                icon = Icons.Filled.Celebration,
                                text = "${stats.upcomingHolidays} upcoming holiday(s)",
                                color = HolidayPurple
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }
                }
            }
            else -> {
                // Determine what to show if no error, no stats, and not loading.
                // This shouldn't typically happen if initial state is correct, but safe to show loading or empty.
                 Box(modifier = Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                    Text("No data available")
                }
            }
        }
    }
}

@Composable
private fun QuickActionCard(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

@Composable
private fun NotificationCard(
    icon: ImageVector,
    text: String,
    color: androidx.compose.ui.graphics.Color
) {
    Card(
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(text = text, style = MaterialTheme.typography.bodyMedium, color = color)
        }
    }
}
