import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LeaveRequest } from '../../core/models/interfaces';

@Component({
    selector: 'app-leaves',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header">Leave Management</h1>
          <p class="page-subtitle">Track and manage employee leave requests</p>
        </div>
        <div class="flex gap-3">
          <select [(ngModel)]="statusFilter" (change)="loadLeaves()" class="input-field w-auto">
            <option value="ALL">All Leaves</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Leave cards -->
      <div class="space-y-4">
        <div *ngFor="let leave of leaves" class="card p-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                {{ leave.employeeName?.charAt(0) || '?' }}
              </div>
              <div>
                <p class="font-semibold text-[var(--text-primary)]">{{ leave.employeeName }}</p>
                <p class="text-sm text-[var(--text-secondary)]">{{ leave.leaveType }} · {{ leave.startDate }} to {{ leave.endDate }}</p>
                <p class="text-sm text-[var(--text-secondary)] mt-1" *ngIf="leave.reason">Reason: {{ leave.reason }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span [class]="getStatusBadge(leave.status)">{{ leave.status }}</span>
              <div *ngIf="authService.isAdmin && leave.status === 'PENDING'" class="flex gap-2">
                <button (click)="approveLeave(leave.id)" class="btn-success text-sm py-1.5 px-4">Approve</button>
                <button (click)="rejectLeave(leave.id)" class="btn-danger text-sm py-1.5 px-4">Reject</button>
              </div>
            </div>
          </div>
          <div *ngIf="leave.adminRemarks" class="mt-3 p-3 bg-[var(--bg-secondary)] rounded-xl text-sm text-[var(--text-secondary)]">
            <span class="font-medium">Admin:</span> {{ leave.adminRemarks }}
          </div>
        </div>

        <div *ngIf="leaves.length === 0" class="text-center py-16 text-[var(--text-secondary)]">
          <svg class="w-16 h-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p>No leave requests found</p>
        </div>
      </div>
    </div>
  `
})
export class LeavesComponent implements OnInit {
    leaves: LeaveRequest[] = [];
    statusFilter = 'ALL';

    constructor(private api: ApiService, public authService: AuthService) { }

    ngOnInit() { this.loadLeaves(); }

    loadLeaves() {
        const obs = this.statusFilter === 'PENDING'
            ? this.api.getPendingLeaves()
            : this.api.getLeaves();
        obs.subscribe(data => {
            this.leaves = this.statusFilter === 'ALL' || this.statusFilter === 'PENDING'
                ? data
                : data.filter(l => l.status === this.statusFilter);
        });
    }

    getStatusBadge(status: string): string {
        return { 'PENDING': 'badge-pending', 'APPROVED': 'badge-approved', 'REJECTED': 'badge-rejected' }[status] || 'badge';
    }

    approveLeave(id: number) {
        this.api.approveLeave(id).subscribe(() => this.loadLeaves());
    }

    rejectLeave(id: number) {
        const remarks = prompt('Rejection reason (optional):');
        this.api.rejectLeave(id, remarks || undefined).subscribe(() => this.loadLeaves());
    }
}
