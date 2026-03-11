import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    Employee, Attendance, LeaveRequest, Holiday,
    Group, MonthlySummary, DashboardStats, Team, UserInfo, UserRole, NotificationPreference,
    LeaveBalance
} from '../models/interfaces';

export interface AppNotification {
    type: string;       // LEAVE | ATTENDANCE | INFO
    title: string;
    content: string;
    timeLabel: string;
    icon: string;
    color: string;      // amber | rose | indigo | emerald
    count: number;
}
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private api = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // Dashboard
    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.api}/dashboard/stats`);
    }
    getDashboardInsights(): Observable<{ insight: string }> {
        return this.http.get<{ insight: string }>(`${this.api}/dashboard/insights`);
    }

    // Employees
    getEmployees(): Observable<Employee[]> {
        return this.http.get<Employee[]>(`${this.api}/employees`);
    }
    getActiveEmployees(): Observable<Employee[]> {
        return this.http.get<Employee[]>(`${this.api}/employees/active`);
    }
    getEmployee(id: number): Observable<Employee> {
        return this.http.get<Employee>(`${this.api}/employees/${id}`);
    }
    createEmployee(emp: Partial<Employee>): Observable<Employee> {
        return this.http.post<Employee>(`${this.api}/employees`, emp);
    }
    updateEmployee(id: number, emp: Partial<Employee>): Observable<Employee> {
        return this.http.put<Employee>(`${this.api}/employees/${id}`, emp);
    }
    deleteEmployee(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/employees/${id}`);
    }

    // Attendance
    getAttendanceByDate(date: string): Observable<Attendance[]> {
        return this.http.get<Attendance[]>(`${this.api}/attendance/date/${date}`);
    }
    getAttendanceByEmployee(employeeId: number): Observable<Attendance[]> {
        return this.http.get<Attendance[]>(`${this.api}/attendance/employee/${employeeId}`);
    }
    getAttendanceByRange(start: string, end: string): Observable<Attendance[]> {
        const params = new HttpParams().set('start', start).set('end', end);
        return this.http.get<Attendance[]>(`${this.api}/attendance/range`, { params });
    }
    processAttendance(chatText: string, date: string): Observable<Attendance[]> {
        return this.http.post<Attendance[]>(`${this.api}/attendance/process`, { chatText, date });
    }
    processAttendanceFromEmail(date: string, gmailEmail: string, gmailPassword: string,
        subjectPattern?: string, groupId?: number): Observable<any> {
        return this.http.post<any>(`${this.api}/attendance/process-email`, {
            date, gmailEmail, gmailPassword, subjectPattern, groupId: groupId?.toString()
        });
    }
    getEmailStatus(gmailEmail: string, gmailPassword: string, subjectPattern?: string): Observable<any> {
        return this.http.post<any>(`${this.api}/attendance/email-status`, {
            gmailEmail, gmailPassword, subjectPattern
        });
    }
    updateAttendance(id: number, data: Partial<Attendance>): Observable<Attendance> {
        return this.http.put<Attendance>(`${this.api}/attendance/${id}`, data);
    }

    // Leaves
    getLeaves(): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.api}/leaves`);
    }
    getPendingLeaves(): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.api}/leaves/pending`);
    }
    getLeavesByEmployee(employeeId: number): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.api}/leaves/employee/${employeeId}`);
    }
    applyLeave(leave: Partial<LeaveRequest>): Observable<LeaveRequest> {
        return this.http.post<LeaveRequest>(`${this.api}/leaves`, leave);
    }
    approveLeaveByTL(id: number, remarks?: string): Observable<LeaveRequest> {
        return this.http.put<LeaveRequest>(`${this.api}/leaves/${id}/tl-approve`, { remarks });
    }
    approveLeaveByManager(id: number, remarks?: string): Observable<LeaveRequest> {
        return this.http.put<LeaveRequest>(`${this.api}/leaves/${id}/manager-approve`, { remarks });
    }
    rejectLeave(id: number, remarks?: string): Observable<LeaveRequest> {
        return this.http.put<LeaveRequest>(`${this.api}/leaves/${id}/reject`, { remarks });
    }
    cancelLeave(id: number, remarks?: string): Observable<LeaveRequest> {
        return this.http.put<LeaveRequest>(`${this.api}/leaves/${id}/cancel`, { remarks });
    }

    // Leave Balances
    getLeaveBalances(employeeId: number, year?: number): Observable<LeaveBalance[]> {
        let params = new HttpParams();
        if (year) {
            params = params.set('year', year.toString());
        }
        return this.http.get<LeaveBalance[]>(`${this.api}/leaves/balances/${employeeId}`, { params });
    }

    // Holidays
    getHolidays(): Observable<Holiday[]> {
        return this.http.get<Holiday[]>(`${this.api}/holidays`);
    }
    createHoliday(holiday: Partial<Holiday>): Observable<Holiday> {
        return this.http.post<Holiday>(`${this.api}/holidays`, holiday);
    }
    updateHoliday(id: number, holiday: Partial<Holiday>): Observable<Holiday> {
        return this.http.put<Holiday>(`${this.api}/holidays/${id}`, holiday);
    }
    deleteHoliday(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/holidays/${id}`);
    }

    // Groups
    getGroups(): Observable<Group[]> {
        return this.http.get<Group[]>(`${this.api}/groups`);
    }
    createGroup(group: Partial<Group>): Observable<Group> {
        return this.http.post<Group>(`${this.api}/groups`, group);
    }
    updateGroup(id: number, group: Partial<Group>): Observable<Group> {
        return this.http.put<Group>(`${this.api}/groups/${id}`, group);
    }
    deleteGroup(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/groups/${id}`);
    }

    // Summary
    getMonthlySummary(month: number, year: number): Observable<MonthlySummary[]> {
        const params = new HttpParams().set('month', month).set('year', year);
        return this.http.get<MonthlySummary[]>(`${this.api}/summary/monthly`, { params });
    }
    generateSummary(month: number, year: number): Observable<MonthlySummary[]> {
        const params = new HttpParams().set('month', month).set('year', year);
        return this.http.post<MonthlySummary[]>(`${this.api}/summary/generate`, null, { params });
    }
    getEmployeeSummary(employeeId: number): Observable<MonthlySummary[]> {
        return this.http.get<MonthlySummary[]>(`${this.api}/summary/employee/${employeeId}`);
    }

    // System Settings
    saveGmailCredentials(data: any): Observable<any> {
        return this.http.post<any>(`${this.api}/settings/gmail`, data);
    }
    getGmailStatus(): Observable<any> {
        return this.http.get<any>(`${this.api}/settings/gmail/status`);
    }
    sendTestEmail(email: string): Observable<any> {
        return this.http.post<any>(`${this.api}/settings/test-email`, { email });
    }
    getAutomationSettings(): Observable<any> {
        return this.http.get<any>(`${this.api}/settings/automation`);
    }
    saveAutomationSettings(data: any): Observable<any> {
        return this.http.post<any>(`${this.api}/settings/automation`, data);
    }

    // Gmail OAuth2
    getGmailOAuthStatus(): Observable<any> {
        return this.http.get<any>(`${this.api}/settings/gmail/oauth/status`);
    }
    getGmailOAuthAuthUrl(): Observable<{ authUrl: string }> {
        return this.http.get<{ authUrl: string }>(`${this.api}/settings/gmail/oauth/authorize`);
    }
    disconnectGmailOAuth(): Observable<any> {
        return this.http.delete<any>(`${this.api}/settings/gmail/oauth`);
    }

    // Gmail Accounts (Per Group)
    getGmailAccounts(): Observable<any[]> {
        return this.http.get<any[]>(`${this.api}/gmail-accounts`);
    }
    getGmailOAuthAuthUrlForGroup(groupId: number): Observable<{ url: string }> {
        return this.http.post<{ url: string }>(`${this.api}/gmail-accounts/oauth/url`, { groupId });
    }
    disconnectGmailAccount(groupId: number): Observable<any> {
        return this.http.delete<any>(`${this.api}/gmail-accounts/${groupId}`);
    }

    // Teams
    getTeams(): Observable<Team[]> {
        return this.http.get<Team[]>(`${this.api}/teams`);
    }
    getActiveTeams(): Observable<Team[]> {
        return this.http.get<Team[]>(`${this.api}/teams/active`);
    }
    getTeam(id: number): Observable<Team> {
        return this.http.get<Team>(`${this.api}/teams/${id}`);
    }
    createTeam(team: Partial<Team>): Observable<Team> {
        return this.http.post<Team>(`${this.api}/teams`, team);
    }
    updateTeam(id: number, team: Partial<Team>): Observable<Team> {
        return this.http.put<Team>(`${this.api}/teams/${id}`, team);
    }
    deleteTeam(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/teams/${id}`);
    }
    getEmployeesByTeam(teamId: number): Observable<Employee[]> {
        return this.http.get<Employee[]>(`${this.api}/employees/team/${teamId}`);
    }

    // User Management (Admin)
    getUsers(): Observable<UserInfo[]> {
        return this.http.get<UserInfo[]>(`${this.api}/admin/users`);
    }
    getAssignableUsers(): Observable<UserInfo[]> {
        return this.http.get<UserInfo[]>(`${this.api}/teams/users`);
    }
    getUsersByRole(role: UserRole): Observable<UserInfo[]> {
        return this.http.get<UserInfo[]>(`${this.api}/admin/users/role/${role}`);
    }
    updateUserRole(userId: number, role: UserRole): Observable<UserInfo> {
        return this.http.put<UserInfo>(`${this.api}/admin/users/${userId}/role`, { role });
    }
    updateUserStatus(userId: number, isActive: boolean): Observable<UserInfo> {
        return this.http.put<UserInfo>(`${this.api}/admin/users/${userId}/status`, { isActive });
    }

    // Dashboard (extended)
    getTeamDashboardStats(teamId: number): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.api}/dashboard/team/${teamId}`);
    }
    getMyDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.api}/dashboard/me`);
    }

    // Attendance (extended)
    getAttendanceByTeam(teamId: number, date: string): Observable<Attendance[]> {
        return this.http.get<Attendance[]>(`${this.api}/attendance/team/${teamId}/date/${date}`);
    }
    checkIn(status: string, remarks?: string): Observable<Attendance> {
        return this.http.post<Attendance>(`${this.api}/attendance/check-in`, { status, remarks });
    }

    // Profile
    getProfile(userId: number): Observable<any> {
        return this.http.get<any>(`${this.api}/profile/${userId}`);
    }
    updateProfile(userId: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.api}/profile/${userId}`, data);
    }

    // Notifications (real-time from backend)
    getNotifications(): Observable<AppNotification[]> {
        return this.http.get<AppNotification[]>(`${this.api}/notifications`);
    }

    // Notification preferences
    getNotificationPreferences(userId: number): Observable<NotificationPreference> {
        return this.http.get<NotificationPreference>(`${this.api}/notification-preferences/${userId}`);
    }
    updateNotificationPreferences(userId: number, data: Partial<NotificationPreference>): Observable<NotificationPreference> {
        return this.http.put<NotificationPreference>(`${this.api}/notification-preferences/${userId}`, data);
    }

    // Reports & Analytics (Phase 5)
    getTeamComparison(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.api}/reports/team-comparison`, { params: { startDate, endDate } });
    }
    getEmployeeReportCards(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.api}/reports/employee-cards`, { params: { startDate, endDate } });
    }
    getWorkTrends(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.api}/reports/work-trends`, { params: { startDate, endDate } });
    }
    exportEmployeeCards(startDate: string, endDate: string, format: 'excel' | 'csv'): Observable<Blob> {
        return this.http.get(`${this.api}/reports/export/employee-cards`, {
            params: { startDate, endDate, format },
            responseType: 'blob'
        });
    }
    exportTeamComparison(startDate: string, endDate: string): Observable<Blob> {
        return this.http.get(`${this.api}/reports/export/team-comparison`, {
            params: { startDate, endDate },
            responseType: 'blob'
        });
    }

    // Bulk Import
    importEmployees(file: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.api}/employees/bulk-import`, formData, { responseType: 'text' });
    }

    // Phase 6
    getAuditLogs(page: number, size: number): Observable<any> {
        return this.http.get(`${this.api}/admin/audit-logs`, { params: { page, size } });
    }

    triggerReminderCheck(): Observable<any> {
        return this.http.post(`${this.api}/settings/automation/trigger-reminder`, {});
    }

    triggerForcedReminder(): Observable<any> {
        return this.http.post(`${this.api}/settings/automation/force-reminder`, {});
    }

    // WhatsApp Import (VCF + Chat export)
    uploadVcf(file: File, groupId: number): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('groupId', groupId.toString());
        return this.http.post<any>(`${this.api}/import/vcf`, formData);
    }

    getVcfStatus(groupId: number): Observable<any> {
        return this.http.get<any>(`${this.api}/import/vcf/status`, { params: { groupId: groupId.toString() } });
    }

    previewWhatsAppImport(file: File, groupId: number): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('groupId', groupId.toString());
        return this.http.post<any>(`${this.api}/import/whatsapp/preview`, formData);
    }

    confirmWhatsAppImport(records: any[]): Observable<any> {
        return this.http.post<any>(`${this.api}/import/whatsapp/confirm`, records);
    }
}
