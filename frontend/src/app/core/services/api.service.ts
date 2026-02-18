import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    Employee, Attendance, LeaveRequest, Holiday,
    Group, MonthlySummary, DashboardStats
} from '../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private api = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // Dashboard
    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.api}/dashboard/stats`);
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
    approveLeave(id: number, remarks?: string): Observable<LeaveRequest> {
        return this.http.put<LeaveRequest>(`${this.api}/leaves/${id}/approve`, { remarks });
    }
    rejectLeave(id: number, remarks?: string): Observable<LeaveRequest> {
        return this.http.put<LeaveRequest>(`${this.api}/leaves/${id}/reject`, { remarks });
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
}
