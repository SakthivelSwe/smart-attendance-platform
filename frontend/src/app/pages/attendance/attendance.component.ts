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
               class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-full border border-emerald-200/60 dark:border-emerald-700/30 text-xs text-emerald-700 dark:text-emerald-400 shadow-sm mr-3">
            <span class="relative flex h-2 w-2 mr-1">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="font-semibold tracking-wide">AUTOMATION ACTIVE</span>
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
                CLASS="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                [ngClass]="activeFilter === f.value ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30' : 'bg-white dark:bg-surface-800 text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-gray-50 dark:hover:bg-surface-700'">
          {{ f.label }} ({{ getCount(f.value) }})
        </button>
      </div>

      <!-- Table -->
      <div class="glass-card overflow-hidden border-0">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-white/50 dark:bg-surface-800/40 backdrop-blur-md border-b border-[var(--border-color)]">
                <th class="text-left px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Employee</th>
                <th class="text-left px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Code</th>
                <th class="text-left px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">In Time</th>
                <th class="text-left px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Out Time</th>
                <th class="text-left px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                <th class="text-left px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Source</th>
                <th class="text-left px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)]">
              <tr *ngFor="let a of filteredAttendance; let i = index" 
                  class="group hover:bg-white/40 dark:hover:bg-surface-700/40 transition-all duration-200 animate-slide-up"
                  [style.animation-delay]="i * 50 + 'ms'">
                <td class="px-6 py-4">
                   <div class="flex items-center gap-3">
                     <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-primary-500/20">
                       {{ a.employeeName.charAt(0) }}
                     </div>
                     <span class="font-semibold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors">{{ a.employeeName }}</span>
                   </div>
                </td>
                <td class="px-6 py-4 text-sm text-[var(--text-secondary)] font-mono">{{ a.employeeCode }}</td>
                <td class="px-6 py-4 text-sm font-medium" [ngClass]="a.inTime ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-secondary)]'">
                  {{ a.inTime || '—' }}
                </td>
                <td class="px-6 py-4 text-sm font-medium" [ngClass]="a.outTime ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)]'">
                  {{ a.outTime || '—' }}
                </td>
                <td class="px-6 py-4">
                  <span [class]="getStatusBadge(a.status)" 
                        class="shadow-sm transition-transform group-hover:scale-105">
                    {{ a.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <span class="px-2 py-0.5 rounded-md text-xs font-medium" 
                        [ngClass]="a.source === 'WHATSAPP' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'">
                    {{ a.source || '—' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-[var(--text-secondary)] max-w-[200px] truncate">{{ a.remarks || '—' }}</td>
              </tr>
              <tr *ngIf="filteredAttendance.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-[var(--text-secondary)]">
                  <div class="flex flex-col items-center animate-fade-in">
                    <div class="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
                      <svg class="w-8 h-8 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <p class="text-lg font-medium">No records found</p>
                    <p class="text-sm opacity-70">Try selecting a different date or filter</p>
                  </div>
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
    { label: 'Bench', value: 'BENCH' },
    { label: 'Training', value: 'TRAINING' },
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
          this.gmailPassword = '***SAVED_IN_DB***';
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
      'HOLIDAY': 'badge-holiday', 'ABSENT': 'badge-absent',
      'BENCH': 'badge-bench', 'TRAINING': 'badge-training'
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
