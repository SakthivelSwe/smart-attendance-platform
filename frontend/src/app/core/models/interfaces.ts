export type UserRole = 'ADMIN' | 'MANAGER' | 'TEAM_LEAD' | 'USER';

export interface User {
    userId: number;
    email: string;
    name: string;
    avatarUrl: string;
    role: UserRole;
    token?: string;
}

export interface UserInfo {
    id: number;
    email: string;
    name: string;
    avatarUrl: string;
    role: UserRole;
    isActive: boolean;
    emailVerified: boolean;
    teamId?: number;
    teamName?: string;
}

export interface Team {
    id: number;
    name: string;
    teamCode: string;
    description: string;
    teamLeadId: number;
    teamLeadName: string;
    teamLeadEmail: string;
    managerId: number;
    managerName: string;
    managerEmail: string;
    emailAlias: string;
    isActive: boolean;
    employeeCount: number;
    groupId?: number;
}

export interface Employee {
    id: number;
    name: string;
    email: string;
    phone: string;
    whatsappName: string;
    employeeCode: string;
    groupId: number;
    groupName: string;
    teamId: number;
    teamName: string;
    designation: string;
    isActive: boolean;
}

export interface Attendance {
    id: number;
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    date: string;
    inTime: string;
    outTime: string;
    status: 'WFO' | 'WFH' | 'LEAVE' | 'HOLIDAY' | 'ABSENT' | 'BENCH' | 'TRAINING';
    source: string;
    remarks: string;
    groupName: string;
}

export interface LeaveApprovalChain {
    id: number;
    leaveId: number;
    approverId: number;
    approverName: string;
    approverRole: string;
    action: string;
    remarks: string;
    createdAt: string;
}

export interface LeaveRequest {
    id: number;
    employeeId: number;
    employeeName: string;
    startDate: string;
    endDate: string;
    reason: string;
    leaveType: string;
    status: 'PENDING' | 'TL_APPROVED' | 'MGR_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    approvedBy: number;
    approvedByName: string;
    adminRemarks: string;
    approvalChain?: LeaveApprovalChain[];
}

export interface LeaveBalance {
    id: number;
    employeeId: number;
    year: number;
    leaveType: string;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
}

export interface Holiday {
    id: number;
    date: string;
    name: string;
    description: string;
    isOptional: boolean;
}

export interface Group {
    id: number;
    name: string;
    whatsappGroupName: string;
    emailSubjectPattern: string;
    googleSheetId: string;
    isActive: boolean;
    employeeCount: number;
}

export interface MonthlySummary {
    id: number;
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    groupName: string;
    month: number;
    year: number;
    wfoCount: number;
    wfhCount: number;
    leaveCount: number;
    holidayCount: number;
    absentCount: number;
    benchCount: number;
    trainingCount: number;
    totalWorkingDays: number;
    totalWorkingHours: number;
    attendancePercentage: number;
}

export interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    wfoToday: number;
    wfhToday: number;
    onLeaveToday: number;
    absentToday: number;
    pendingLeaves: number;
    upcomingHolidays: number;
}

export interface NotificationPreference {
    id: number;
    teamDailySummary: boolean;
    absenceAlert: boolean;
    managerDailySummary: boolean;
    lowAttendanceAlert: boolean;
    lowAttendanceThreshold: number;
    leaveRequestAlert: boolean;
    leaveStatusAlert: boolean;
    emailEnabled: boolean;
    whatsappEnabled: boolean;
}

export interface TeamComparison {
    teamId: number;
    teamName: string;
    totalEmployees: number;
    totalPresent: number;
    totalAbsent: number;
    totalOnLeave: number;
    attendanceRate: number;
}

export interface EmployeeReportCard {
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    teamName: string;
    totalWorkingDays: number;
    totalPresent: number;
    totalAbsent: number;
    totalOnLeave: number;
    wfhDays: number;
    attendanceRate: number;
}

export interface WorkTrend {
    date: string;
    wfoCount: number;
    wfhCount: number;
    leaveCount: number;
}

export interface AuditLog {
    id: number;
    username: string;
    actionType: string;
    details: string;
    ipAddress: string;
    timestamp: string;
}
