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
          <div *ngIf="automationConfigured" 
               class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg border border-primary-100 text-xs text-primary-600 mr-2">
            <span class="material-icons text-[16px] animate-pulse">check_circle</span>
            <span class="font-medium whitespace-nowrap">Automation ACTIVE (6AM/7PM)</span>
          </div>
          <input type="date" [(ngModel)]="selectedDate" (change)="loadAttendance()"
                 class="input-field w-auto"/>
          <button *ngIf="authService.isAdmin" (click)="showEmailModal = true" class="btn-primary whitespace-nowrap"
                  title="Fetch WhatsApp chat from Gmail automatically">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Fetch Email
            </span>
          </button>
          <button *ngIf="authService.isAdmin" (click)="showProcessModal = true" class="btn-secondary whitespace-nowrap">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
              Paste Chat
            </span>
          </button>
        </div>
      </div>

      <!-- Email fetch result banner -->
      <div *ngIf="emailMessage" class="mb-4 p-4 rounded-xl text-sm flex items-start gap-3"
           [ngClass]="emailSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path *ngIf="emailSuccess" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          <path *ngIf="!emailSuccess" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <p class="font-medium">{{ emailMessage }}</p>
          <p *ngIf="emailPreview" class="mt-2 text-xs opacity-75 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">{{ emailPreview }}</p>
        </div>
        <button (click)="emailMessage = ''" class="ml-auto opacity-50 hover:opacity-100">✕</button>
      </div>

      <!-- Status filter tabs -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button *ngFor="let f of filters"
                (click)="activeFilter = f.value"
                class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                [ngClass]="activeFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  No attendance records found for this date
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Fetch from Email modal -->
      <div *ngIf="showEmailModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slide-up">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-1">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Fetch from Gmail
            </span>
          </h3>
          <p class="text-sm text-[var(--text-secondary)] mb-5">Enter your Gmail credentials to read WhatsApp chat export from inbox</p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Gmail Email</label>
              <input type="email" [(ngModel)]="gmailEmail" class="input-field" placeholder="your.email@gmail.com">
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Gmail App Password</label>
              <input type="password" [(ngModel)]="gmailPassword" class="input-field" placeholder="Enter 16-char App Password">
              <p class="text-xs text-[var(--text-secondary)] mt-1">Generate at myaccount.google.com/apppasswords</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
              <input type="date" [(ngModel)]="emailDate" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Subject Pattern</label>
              <input type="text" [(ngModel)]="emailSubjectPattern" class="input-field" placeholder="e.g., WhatsApp Chat with Java Team">
              <p class="text-xs text-[var(--text-secondary)] mt-1">Matches emails with subjects containing this text</p>
            </div>
          </div>

          <div *ngIf="emailFetching" class="mt-4 flex items-center gap-3 text-sm text-primary-500">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Connecting to Gmail and fetching email...
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button (click)="showEmailModal = false" class="btn-secondary">Cancel</button>
            <button (click)="fetchFromEmail()" class="btn-primary" [disabled]="emailFetching || !gmailEmail || !gmailPassword">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                {{ emailFetching ? 'Fetching...' : 'Fetch & Process' }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Manual paste modal -->
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

  // Email fetch
  showEmailModal = false;
  gmailEmail = '';
  gmailPassword = '';
  emailDate = new Date().toISOString().split('T')[0];
  emailSubjectPattern = 'WhatsApp Chat with Java Team';
  emailMessage = '';
  emailSuccess = false;
  emailPreview = '';
  emailFetching = false;
  automationConfigured = false;

  filters = [
    { label: 'All', value: 'ALL' },
    { label: 'WFO', value: 'WFO' },
    { label: 'WFH', value: 'WFH' },
    { label: 'Leave', value: 'LEAVE' },
    { label: 'Holiday', value: 'HOLIDAY' },
    { label: 'Absent', value: 'ABSENT' },
  ];

  constructor(private api: ApiService, public authService: AuthService) { }

  ngOnInit() {
    this.loadAttendance();
    this.checkAutomationStatus();
  }

  checkAutomationStatus() {
    this.api.getGmailStatus().subscribe({
      next: (status) => {
        this.automationConfigured = status.configured;
        if (status.configured) {
          this.gmailEmail = status.email;
          // We keep password blank for security, 
          // but the backend can use stored if we send a special flag or handle it differently.
          // For now, if we have it in settings, we can inform the user.
        }
      }
    });
  }

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

  fetchFromEmail() {
    this.emailFetching = true;
    this.emailMessage = '';
    this.emailPreview = '';

    this.api.processAttendanceFromEmail(this.emailDate, this.gmailEmail, this.gmailPassword, this.emailSubjectPattern).subscribe({
      next: (response) => {
        this.emailFetching = false;
        this.showEmailModal = false;
        this.emailSuccess = response.success;
        this.emailMessage = response.message;

        if (response.success && response.attendance) {
          this.attendance = response.attendance;
          this.selectedDate = this.emailDate;
        }
        if (response.chatTextPreview) {
          this.emailPreview = response.chatTextPreview;
        }
      },
      error: (err) => {
        this.emailFetching = false;
        this.showEmailModal = false;
        this.emailSuccess = false;
        this.emailMessage = err.error?.message || 'Failed to fetch email. Check Gmail IMAP settings.';
      }
    });
  }
}
