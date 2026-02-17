import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Attendance } from '../../core/models/interfaces';

@Component({
    selector: 'app-attendance',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header">Attendance</h1>
          <p class="page-subtitle">Daily attendance records and processing</p>
        </div>
        <div class="flex items-center gap-3">
          <input type="date" [(ngModel)]="selectedDate" (change)="loadAttendance()"
                 class="input-field w-auto"/>
          <button *ngIf="authService.isAdmin" (click)="showProcessModal = true" class="btn-primary whitespace-nowrap">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Process
            </span>
          </button>
        </div>
      </div>

      <!-- Status filter tabs -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button *ngFor="let f of filters"
                (click)="activeFilter = f.value"
                class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                [class.bg-primary-600]="activeFilter === f.value"
                [class.text-white]="activeFilter === f.value"
                [class.bg-surface-100]="activeFilter !== f.value"
                [class.dark:bg-surface-800]="activeFilter !== f.value"
                [class.text-surface-600]="activeFilter !== f.value"
                [class.dark:text-surface-400]="activeFilter !== f.value">
          {{ f.label }} ({{ getCount(f.value) }})
        </button>
      </div>

      <!-- Table -->
      <div class="table-container">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="table-header">
                <th class="text-left px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Employee</th>
                <th class="text-left px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Code</th>
                <th class="text-left px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">In Time</th>
                <th class="text-left px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Out Time</th>
                <th class="text-left px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                <th class="text-left px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Source</th>
                <th class="text-left px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)]">
              <tr *ngFor="let a of filteredAttendance" class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition">
                <td class="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{{ a.employeeName }}</td>
                <td class="px-6 py-4 text-sm text-[var(--text-secondary)]">{{ a.employeeCode }}</td>
                <td class="px-6 py-4 text-sm text-[var(--text-secondary)]">{{ a.inTime || '—' }}</td>
                <td class="px-6 py-4 text-sm text-[var(--text-secondary)]">{{ a.outTime || '—' }}</td>
                <td class="px-6 py-4">
                  <span [class]="getStatusBadge(a.status)">{{ a.status }}</span>
                </td>
                <td class="px-6 py-4 text-sm text-[var(--text-secondary)]">{{ a.source || '—' }}</td>
                <td class="px-6 py-4 text-sm text-[var(--text-secondary)] max-w-[200px] truncate">{{ a.remarks || '—' }}</td>
              </tr>
              <tr *ngIf="filteredAttendance.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-[var(--text-secondary)]">
                  <svg class="w-12 h-12 mx-auto mb-3 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  No attendance records found for this date
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Process modal -->
      <div *ngIf="showProcessModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slide-up">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Process WhatsApp Chat</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
              <input type="date" [(ngModel)]="processDate" class="input-field"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Chat Text</label>
              <textarea [(ngModel)]="chatText" rows="8" class="input-field resize-none" placeholder="Paste WhatsApp chat export here..."></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="showProcessModal = false" class="btn-secondary">Cancel</button>
            <button (click)="processChat()" class="btn-primary" [disabled]="!chatText">Process</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceComponent implements OnInit {
    attendance: Attendance[] = [];
    selectedDate = new Date().toISOString().split('T')[0];
    activeFilter = 'ALL';
    showProcessModal = false;
    chatText = '';
    processDate = new Date().toISOString().split('T')[0];

    filters = [
        { label: 'All', value: 'ALL' },
        { label: 'WFO', value: 'WFO' },
        { label: 'WFH', value: 'WFH' },
        { label: 'Leave', value: 'LEAVE' },
        { label: 'Holiday', value: 'HOLIDAY' },
        { label: 'Absent', value: 'ABSENT' },
    ];

    constructor(private api: ApiService, public authService: AuthService) { }

    ngOnInit() { this.loadAttendance(); }

    loadAttendance() {
        this.api.getAttendanceByDate(this.selectedDate).subscribe(data => this.attendance = data);
    }

    get filteredAttendance() {
        if (this.activeFilter === 'ALL') return this.attendance;
        return this.attendance.filter(a => a.status === this.activeFilter);
    }

    getCount(filter: string): number {
        if (filter === 'ALL') return this.attendance.length;
        return this.attendance.filter(a => a.status === filter).length;
    }

    getStatusBadge(status: string): string {
        const map: Record<string, string> = {
            'WFO': 'badge-wfo', 'WFH': 'badge-wfh', 'LEAVE': 'badge-leave',
            'HOLIDAY': 'badge-holiday', 'ABSENT': 'badge-absent'
        };
        return map[status] || 'badge';
    }

    processChat() {
        this.api.processAttendance(this.chatText, this.processDate).subscribe({
            next: (data) => {
                this.attendance = data;
                this.showProcessModal = false;
                this.chatText = '';
                this.selectedDate = this.processDate;
            }
        });
    }
}
