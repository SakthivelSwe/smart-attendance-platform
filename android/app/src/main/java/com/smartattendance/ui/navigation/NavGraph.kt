package com.smartattendance.ui.navigation

import androidx.compose.animation.*
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.smartattendance.data.local.TokenManager
import com.smartattendance.ui.screens.attendance.AttendanceScreen
import com.smartattendance.ui.screens.auth.LoginScreen
import com.smartattendance.ui.screens.dashboard.DashboardScreen
import com.smartattendance.ui.screens.employees.EmployeeFormScreen
import com.smartattendance.ui.screens.employees.EmployeeListScreen
import com.smartattendance.ui.screens.groups.GroupFormScreen
import com.smartattendance.ui.screens.groups.GroupListScreen
import com.smartattendance.ui.screens.holidays.HolidayFormScreen
import com.smartattendance.ui.screens.holidays.HolidayListScreen
import com.smartattendance.ui.screens.leaves.LeaveListScreen
import com.smartattendance.ui.screens.settings.SettingsScreen
import com.smartattendance.ui.screens.summary.SummaryScreen
import javax.inject.Inject

data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

val bottomNavItems = listOf(
    BottomNavItem(Screen.Dashboard, "Dashboard", Icons.Filled.Dashboard, Icons.Outlined.Dashboard),
    BottomNavItem(Screen.Attendance, "Attendance", Icons.Filled.EventNote, Icons.Outlined.EventNote),
    BottomNavItem(Screen.Employees, "Employees", Icons.Filled.People, Icons.Outlined.People),
    BottomNavItem(Screen.Leaves, "Leaves", Icons.Filled.BeachAccess, Icons.Outlined.BeachAccess),
    BottomNavItem(Screen.Settings, "Settings", Icons.Filled.Settings, Icons.Outlined.Settings),
)

@Composable
fun SmartAttendNavHost() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    val bottomBarRoutes = bottomNavItems.map { it.screen.route }
    val showBottomBar = currentDestination?.route in bottomBarRoutes

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    tonalElevation = NavigationBarDefaults.Elevation,
                ) {
                    bottomNavItems.forEach { item ->
                        val selected = currentDestination?.hierarchy?.any { it.route == item.screen.route } == true
                        NavigationBarItem(
                            icon = {
                                Icon(
                                    if (selected) item.selectedIcon else item.unselectedIcon,
                                    contentDescription = item.label
                                )
                            },
                            label = { Text(item.label, style = MaterialTheme.typography.labelSmall) },
                            selected = selected,
                            onClick = {
                                navController.navigate(item.screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Login.route,
            modifier = Modifier.padding(innerPadding),
            enterTransition = { fadeIn() + slideInHorizontally { it / 4 } },
            exitTransition = { fadeOut() + slideOutHorizontally { -it / 4 } },
            popEnterTransition = { fadeIn() + slideInHorizontally { -it / 4 } },
            popExitTransition = { fadeOut() + slideOutHorizontally { it / 4 } },
        ) {
            composable(Screen.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    onNavigateToGroups = { navController.navigate(Screen.Groups.route) },
                    onNavigateToHolidays = { navController.navigate(Screen.Holidays.route) },
                    onNavigateToSummary = { navController.navigate(Screen.Summary.route) }
                )
            }

            composable(Screen.Attendance.route) {
                AttendanceScreen()
            }

            composable(Screen.Employees.route) {
                EmployeeListScreen(
                    onAddEmployee = { navController.navigate(Screen.EmployeeForm.createRoute()) },
                    onEditEmployee = { id -> navController.navigate(Screen.EmployeeForm.createRoute(id)) }
                )
            }

            composable(
                Screen.EmployeeForm.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType; nullable = true; defaultValue = null })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id")?.toLongOrNull()
                EmployeeFormScreen(
                    employeeId = id,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Leaves.route) {
                LeaveListScreen()
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Groups.route) {
                GroupListScreen(
                    onAddGroup = { navController.navigate(Screen.GroupForm.createRoute()) },
                    onEditGroup = { id -> navController.navigate(Screen.GroupForm.createRoute(id)) },
                    onBack = { navController.popBackStack() }
                )
            }

            composable(
                Screen.GroupForm.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType; nullable = true; defaultValue = null })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id")?.toLongOrNull()
                GroupFormScreen(
                    groupId = id,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Holidays.route) {
                HolidayListScreen(
                    onAddHoliday = { navController.navigate(Screen.HolidayForm.createRoute()) },
                    onEditHoliday = { id -> navController.navigate(Screen.HolidayForm.createRoute(id)) },
                    onBack = { navController.popBackStack() }
                )
            }

            composable(
                Screen.HolidayForm.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType; nullable = true; defaultValue = null })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id")?.toLongOrNull()
                HolidayFormScreen(
                    holidayId = id,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Summary.route) {
                SummaryScreen(onBack = { navController.popBackStack() })
            }
        }
    }
}
