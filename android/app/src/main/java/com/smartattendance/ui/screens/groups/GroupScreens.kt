package com.smartattendance.ui.screens.groups

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
import com.smartattendance.data.model.Group
import com.smartattendance.ui.components.*
import com.smartattendance.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GroupListScreen(
    onAddGroup: () -> Unit,
    onEditGroup: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: GroupViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Groups", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") } }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddGroup) {
                Icon(Icons.Default.Add, "Add group")
            }
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingView(modifier = Modifier.padding(padding))
            uiState.error != null -> ErrorView(uiState.error!!, onRetry = { viewModel.loadGroups() }, modifier = Modifier.padding(padding))
            uiState.groups.isEmpty() -> EmptyView("No groups yet", modifier = Modifier.padding(padding))
            else -> {
                LazyColumn(
                    modifier = Modifier.padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.groups) { group ->
                        GroupCard(group = group, onEdit = { group.id?.let(onEditGroup) }, onDelete = { group.id?.let(viewModel::deleteGroup) })
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }
}

@Composable
private fun GroupCard(group: Group, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(shape = RoundedCornerShape(12.dp), onClick = onEdit, elevation = CardDefaults.cardElevation(1.dp)) {
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(group.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                group.whatsappGroupName?.let { Text("WhatsApp: $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                Text("${group.employeeCount ?: 0} employees", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (group.isActive == true) {
                Surface(shape = RoundedCornerShape(20.dp), color = Emerald600.copy(alpha = 0.1f)) {
                    Text("Active", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, color = Emerald600)
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
fun GroupFormScreen(groupId: Long?, onBack: () -> Unit, viewModel: GroupViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    val isEdit = groupId != null
    var name by remember { mutableStateOf("") }
    var whatsappName by remember { mutableStateOf("") }
    var isActive by remember { mutableStateOf(true) }

    LaunchedEffect(groupId) { groupId?.let { viewModel.loadGroup(it) } }
    LaunchedEffect(uiState.formGroup) { uiState.formGroup?.let { name = it.name; whatsappName = it.whatsappGroupName ?: ""; isActive = it.isActive ?: true } }
    LaunchedEffect(uiState.formSuccess) { if (uiState.formSuccess) onBack() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEdit) "Edit Group" else "Add Group", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") } }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Group Name *") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(value = whatsappName, onValueChange = { whatsappName = it }, label = { Text("WhatsApp Group Name") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Active", style = MaterialTheme.typography.bodyLarge)
                Switch(checked = isActive, onCheckedChange = { isActive = it })
            }
            Button(
                onClick = { viewModel.saveGroup(Group(id = groupId, name = name, whatsappGroupName = whatsappName.ifBlank { null }, emailSubjectPattern = null, googleSheetId = null, isActive = isActive, employeeCount = null)) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                enabled = name.isNotBlank() && !uiState.isFormLoading
            ) {
                if (uiState.isFormLoading) { CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp); Spacer(modifier = Modifier.width(8.dp)) }
                Text(if (isEdit) "Update Group" else "Create Group")
            }
        }
    }
}
