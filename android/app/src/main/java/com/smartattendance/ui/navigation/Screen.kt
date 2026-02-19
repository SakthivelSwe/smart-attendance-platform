package com.smartattendance.ui.navigation

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Dashboard : Screen("dashboard")
    data object Attendance : Screen("attendance")
    data object Employees : Screen("employees")
    data object EmployeeForm : Screen("employee_form?id={id}") {
        fun createRoute(id: Long? = null) = if (id != null) "employee_form?id=$id" else "employee_form"
    }
    data object Leaves : Screen("leaves")
    data object Settings : Screen("settings")
    data object Groups : Screen("groups")
    data object GroupForm : Screen("group_form?id={id}") {
        fun createRoute(id: Long? = null) = if (id != null) "group_form?id=$id" else "group_form"
    }
    data object Holidays : Screen("holidays")
    data object HolidayForm : Screen("holiday_form?id={id}") {
        fun createRoute(id: Long? = null) = if (id != null) "holiday_form?id=$id" else "holiday_form"
    }
    data object Summary : Screen("summary")
}
