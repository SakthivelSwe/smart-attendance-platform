import { Routes } from '@angular/router';
import { authGuard, adminGuard, teamLeadGuard, managerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
    { path: 'verify-email', loadComponent: () => import('./pages/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
    { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
    { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
    {
        path: '',
        loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
        canActivate: [authGuard],
        children: [
            // All roles
            { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'attendance', loadComponent: () => import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent), canActivate: [authGuard] },
            { path: 'employees', loadComponent: () => import('./pages/employees/employees.component').then(m => m.EmployeesComponent), canActivate: [authGuard] },
            { path: 'leaves', loadComponent: () => import('./pages/leaves/leaves.component').then(m => m.LeavesComponent), canActivate: [authGuard] },
            { path: 'holidays', loadComponent: () => import('./pages/holidays/holidays.component').then(m => m.HolidaysComponent), canActivate: [authGuard] },
            { path: 'org-chart', loadComponent: () => import('./pages/org-chart/org-chart.component').then(m => m.OrgChartComponent), canActivate: [authGuard] },
            { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
            { path: 'notification-settings', loadComponent: () => import('./pages/notification-settings/notification-settings.component').then(m => m.NotificationSettingsComponent), canActivate: [authGuard] },
            // TEAM_LEAD and above
            { path: 'summary', loadComponent: () => import('./pages/summary/summary.component').then(m => m.SummaryComponent), canActivate: [teamLeadGuard] },
            { path: 'teams', loadComponent: () => import('./pages/teams/teams.component').then(m => m.TeamsComponent), canActivate: [teamLeadGuard] },
            { path: 'reports', loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent), canActivate: [teamLeadGuard] },
            { path: 'employee-report-card', loadComponent: () => import('./pages/employee-report-card/employee-report-card.component').then(m => m.EmployeeReportCardComponent), canActivate: [teamLeadGuard] },
            { path: 'groups', loadComponent: () => import('./pages/groups/groups.component').then(m => m.GroupsComponent), canActivate: [teamLeadGuard] },
            // ADMIN only
            { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent), canActivate: [adminGuard] },
            { path: 'user-management', loadComponent: () => import('./pages/user-management/user-management.component').then(m => m.UserManagementComponent), canActivate: [adminGuard] },
            { path: 'audit-logs', loadComponent: () => import('./pages/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent), canActivate: [adminGuard] },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ]
    },
    { path: '**', redirectTo: 'login' },
];
