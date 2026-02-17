export interface User {
    userId: number;
    email: string;
    name: string;
    avatarUrl: string;
    role: 'ADMIN' | 'USER';
    token?: string;
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
    status: 'WFO' | 'WFH' | 'LEAVE' | 'HOLIDAY' | 'ABSENT';
    source: string;
    remarks: string;
    groupName: string;
}

export interface LeaveRequest {
    id: number;
    employeeId: number;
    employeeName: string;
    startDate: string;
    endDate: string;
    reason: string;
    leaveType: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy: number;
    approvedByName: string;
    adminRemarks: string;
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
    totalWorkingDays: number;
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
