import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Central permission service. Use this in templates with *ngIf instead of
 * duplicating role checks in every component. This eliminates "Permission Denied"
 * popups — buttons simply don't render for unauthorized roles.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {

    constructor(private auth: AuthService) { }

    // ─── Attendance Module ──────────────────────────────────────────────────────

    /** ADMIN or MANAGER can fetch attendance from email or check email status */
    canFetchEmail(): boolean { return this.auth.isManager; }

    /** ADMIN or MANAGER can paste WhatsApp chat text to process attendance */
    canPasteChat(): boolean { return this.auth.isManager; }

    /** ADMIN or MANAGER can see the email-status/refresh panel */
    canViewEmailStatus(): boolean { return this.auth.isManager; }

    // ─── Employee Module ────────────────────────────────────────────────────────

    /** ADMIN or MANAGER can add, edit, or delete employees */
    canManageEmployees(): boolean { return this.auth.isManager; }

    // ─── Leave Module ───────────────────────────────────────────────────────────

    /** TEAM_LEAD and above can approve or reject leave requests */
    canApproveLeaves(): boolean { return this.auth.isTeamLead; }

    // ─── Organisation Module ────────────────────────────────────────────────────

    /** TEAM_LEAD and above can view and manage groups */
    canAccessGroups(): boolean { return this.auth.isTeamLead; }

    /** TEAM_LEAD and above can view teams */
    canAccessTeams(): boolean { return this.auth.isTeamLead; }

    // ─── Admin-Only Actions ─────────────────────────────────────────────────────

    /** Only ADMIN can access system settings */
    canManageSettings(): boolean { return this.auth.isAdmin; }

    /** Only ADMIN can manage user accounts and roles */
    canManageUsers(): boolean { return this.auth.isAdmin; }

    /** Only ADMIN can delete or override attendance records */
    canDeleteAttendance(): boolean { return this.auth.isAdmin; }

    /** Only ADMIN can view audit logs */
    canViewAuditLogs(): boolean { return this.auth.isAdmin; }
}
