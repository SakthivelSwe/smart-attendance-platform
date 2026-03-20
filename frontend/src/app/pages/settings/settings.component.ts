import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="mb-8">
        <h1 class="page-header">Settings</h1>
        <p class="page-subtitle">Configure your preferences and automation settings</p>
      </div>

      <div class="space-y-6 max-w-2xl">
        <!-- Gmail OAuth2 Section (Admin ONLY) -->
        <div class="card p-6 relative overflow-hidden" *ngIf="authService.currentUser?.role === 'ADMIN'">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/40 to-transparent"></div>
          <div class="flex items-center gap-3 mb-6">
            <div class="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-200/60 dark:border-primary-800/40">
              <span class="material-icons text-primary-600 dark:text-primary-400">mail</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-[var(--text-primary)] font-sans tracking-tight">Gmail Account</h3>
              <p class="text-sm text-[var(--text-secondary)] font-body">Connect your Gmail to send automated emails</p>
            </div>
          </div>

          <!-- Connected State -->
          <div *ngIf="oauthStatus?.connected" class="space-y-4">
            <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center">
                <span class="material-icons text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
              </div>
              <div class="flex-1">
                <p class="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-sans">Connected via Google</p>
                <p class="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5 font-body">{{ oauthStatus.email }}</p>
              </div>
              <span class="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-bold border border-emerald-200/60 dark:border-emerald-800/40 uppercase tracking-wider">OAuth2</span>
            </div>

            <div class="flex gap-3">
              <button (click)="testEmail()" [disabled]="loading"
                      class="btn-primary flex-1">
                <span *ngIf="loading" class="material-icons animate-spin text-sm">sync</span>
                <span class="material-icons text-sm" *ngIf="!loading">send</span>
                <span>Send Test Email</span>
              </button>
              <button (click)="disconnectGmail()" [disabled]="loading"
                      class="btn-secondary px-4">
                <span class="material-icons text-sm">link_off</span>
                <span>Disconnect</span>
              </button>
            </div>

            <p class="text-xs text-[var(--text-tertiary)] text-center font-body">
              ✅ No App Password needed. Emails are sent via Gmail API.
            </p>
          </div>

          <!-- Not Connected State -->
          <div *ngIf="!oauthStatus?.connected" class="space-y-4">
            <div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40">
              <p class="text-sm text-amber-700 dark:text-amber-400 font-bold font-sans">No Gmail account connected</p>
              <p class="text-xs text-amber-600 dark:text-amber-500 mt-1 font-body leading-relaxed">
                Click "Connect Gmail Account" to sign in with Google. No App Password required — just sign in once and emails will work automatically.
              </p>
            </div>

            <button (click)="connectGmail()" [disabled]="loading"
                    class="btn-primary w-full py-3">
              <span *ngIf="loading" class="material-icons animate-spin text-sm">sync</span>
              <svg *ngIf="!loading" width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span class="font-bold">{{ loading ? 'Redirecting to Google...' : 'Connect Gmail Account' }}</span>
            </button>

            <p class="text-xs text-[var(--text-tertiary)] text-center font-body">
              You'll be redirected to Google's secure sign-in page.
            </p>
          </div>
        </div>

        <!-- Automation Preferences -->
        <div class="card p-6 relative overflow-hidden" *ngIf="authService.currentUser?.role === 'ADMIN'">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/40 to-transparent"></div>
          <div class="flex items-center gap-3 mb-6">
            <div class="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-200/60 dark:border-primary-800/40">
              <span class="material-icons text-primary-600 dark:text-primary-400">schedule</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-[var(--text-primary)] font-sans tracking-tight">Automation Timings & Reminders</h3>
              <p class="text-sm text-[var(--text-secondary)] font-body">Configure when tasks run and how you are notified</p>
            </div>
          </div>

          <div class="space-y-6">
            <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-transparent hover:border-primary-200/60 dark:hover:border-primary-800/40 transition-all">
              <div>
                <p class="font-bold text-[var(--text-primary)] text-sm font-sans">Email Reminders</p>
                <p class="text-xs text-[var(--text-secondary)] mt-0.5 font-body">Receive an alert if chat export is missing</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="automationData.emailReminderEnabled" class="sr-only peer">
                <div class="w-11 h-6 bg-surface-300 dark:bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <!-- Time Selectors -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Reminder Time -->
              <div class="space-y-2">
                <label class="form-label">Reminder Check Time</label>
                <div class="flex items-center gap-2 p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm">
                  <span class="material-icons text-[var(--text-tertiary)] text-sm">notifications_active</span>
                  <select [(ngModel)]="reminder_h" (change)="updateReminderTime()" class="bg-transparent border-none outline-none text-sm font-bold text-[var(--text-primary)] w-14 cursor-pointer font-sans">
                    <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
                  </select>
                  <span class="text-[var(--text-tertiary)] font-bold">:</span>
                  <select [(ngModel)]="reminder_m" (change)="updateReminderTime()" class="bg-transparent border-none outline-none text-sm font-bold text-[var(--text-primary)] w-14 cursor-pointer font-sans">
                    <option *ngFor="let m of minutes" [value]="m">{{ m }}</option>
                  </select>
                  <select [(ngModel)]="reminder_ampm" (change)="updateReminderTime()" class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-none outline-none text-xs font-extrabold rounded-lg px-2 py-1 cursor-pointer">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <!-- Processing Time -->
              <div class="space-y-2">
                <label class="form-label">Automatic Process Time</label>
                <div class="flex items-center gap-2 p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm">
                  <span class="material-icons text-[var(--text-tertiary)] text-sm">sync</span>
                  <select [(ngModel)]="process_h" (change)="updateProcessingTime()" class="bg-transparent border-none outline-none text-sm font-bold text-[var(--text-primary)] w-14 cursor-pointer font-sans">
                    <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
                  </select>
                  <span class="text-[var(--text-tertiary)] font-bold">:</span>
                  <select [(ngModel)]="process_m" (change)="updateProcessingTime()" class="bg-transparent border-none outline-none text-sm font-bold text-[var(--text-primary)] w-14 cursor-pointer font-sans">
                    <option *ngFor="let m of minutes" [value]="m">{{ m }}</option>
                  </select>
                  <select [(ngModel)]="process_ampm" (change)="updateProcessingTime()" class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-none outline-none text-xs font-extrabold rounded-lg px-2 py-1 cursor-pointer">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <button (click)="saveAutomationSettings()" [disabled]="automationLoading"
                      class="btn-primary flex-1 py-3">
                <span *ngIf="automationLoading" class="material-icons animate-spin text-sm">sync</span>
                <span class="font-bold">Save Scheduler Policy</span>
              </button>

              <button (click)="runNow()" [disabled]="automationLoading"
                      class="btn-secondary px-6"
                      title="Run manual check now">
                <span class="material-icons text-sm">play_circle</span>
                <span>Run Now</span>
              </button>
            </div>
          </div>
        </div>


        <!-- Appearance -->
        <div class="card p-6">
          <h3 class="text-base font-bold text-[var(--text-primary)] mb-5 font-sans tracking-tight">Appearance</h3>
          <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
            <div>
              <p class="font-bold text-[var(--text-primary)] text-sm font-sans">Dark Mode</p>
              <p class="text-xs text-[var(--text-secondary)] mt-0.5 font-body">Toggle between light and dark themes</p>
            </div>
            <button (click)="themeService.toggleTheme()"
                    class="relative w-14 h-7 rounded-full transition-colors duration-300"
                    [class.bg-primary-600]="themeService.isDark"
                    [class.bg-surface-300]="!themeService.isDark">
              <span class="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300"
                    [class.translate-x-7]="themeService.isDark"></span>
            </button>
          </div>
        </div>

        <!-- Account -->
        <div class="card p-6" *ngIf="authService.currentUser as user">
          <h3 class="text-base font-bold text-[var(--text-primary)] mb-5 font-sans tracking-tight">Account</h3>
          <div class="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)]">
            <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name + '&background=1d43f1&color=fff&bold=true'"
                 class="w-14 h-14 rounded-2xl ring-2 ring-primary-500/20 shadow-sm object-cover" [alt]="user.name"/>
            <div>
              <p class="font-bold text-[var(--text-primary)] text-lg font-sans">{{ user.name }}</p>
              <p class="text-sm text-[var(--text-secondary)] font-body">{{ user.email }}</p>
              <span class="inline-block mt-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border"
                    [ngClass]="user.role === 'ADMIN' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border-primary-200/60 dark:border-primary-800/40' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300 border-surface-200/60 dark:border-surface-700/40'">
                {{ user.role }}
              </span>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="card p-6">
          <h3 class="text-base font-bold text-[var(--text-primary)] mb-5 font-sans tracking-tight">About</h3>
          <div class="space-y-3 text-sm text-[var(--text-secondary)] font-body">
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
              <span class="font-medium">Application</span>
              <span class="font-bold text-[var(--text-primary)] font-sans">Smart Attendance Platform</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
              <span class="font-medium">Version</span>
              <span class="font-bold text-[var(--text-primary)] font-sans">1.0.0</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
              <span class="font-medium">Frontend</span>
              <span class="font-bold text-[var(--text-primary)] font-sans">Angular 17</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
              <span class="font-medium">Automation</span>
              <span class="font-bold text-[var(--text-primary)] font-sans">WhatsApp + Gmail</span>
            </div>
          </div>
        </div>

        <button (click)="authService.logout()" class="btn-danger w-full py-3 text-sm font-bold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          Sign Out
        </button>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  oauthStatus: any = null;
  loading = false;

  automationData = {
    emailReminderEnabled: true,
    whatsappReminderEnabled: false,
    reminderTime: '11:30',
    processingTime: '12:00'
  };
  automationLoading = false;

  // Time Picker Helpers
  hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  reminder_h = '11';
  reminder_m = '30';
  reminder_ampm = 'AM';

  process_h = '12';
  process_m = '00';
  process_ampm = 'PM';

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private apiService: ApiService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    if (this.authService.currentUser?.role === 'ADMIN') {
      this.loadOAuthStatus();
      this.loadAutomationSettings();
    }
    // Handle OAuth callback result from query params (Google redirects back here)
    this.route.queryParams.subscribe(params => {
      if (params['gmail_oauth'] === 'success') {
        this.toast.success(`Gmail connected successfully! Account: ${params['email']}`);
        this.loadOAuthStatus();
      } else if (params['gmail_oauth'] === 'error') {
        this.toast.error(`Gmail connection failed: ${params['reason'] || 'Unknown error'}`);
      }
    });
  }

  loadOAuthStatus() {
    this.apiService.getGmailOAuthStatus().subscribe({
      next: (status) => this.oauthStatus = status,
      error: () => this.oauthStatus = { connected: false, email: '' }
    });
  }

  connectGmail() {
    this.loading = true;
    this.apiService.getGmailOAuthAuthUrl().subscribe({
      next: (res) => {
        // Redirect the browser to Google's OAuth2 consent page
        window.location.href = res.authUrl;
      },
      error: () => {
        this.toast.error('Failed to start Gmail authentication. Please try again.');
        this.loading = false;
      }
    });
  }

  disconnectGmail() {
    this.loading = true;
    this.apiService.disconnectGmailOAuth().subscribe({
      next: () => {
        this.toast.success('Gmail account disconnected.');
        this.oauthStatus = { connected: false, email: '' };
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to disconnect Gmail account.');
        this.loading = false;
      }
    });
  }

  testEmail() {
    const emailToTest = this.oauthStatus?.email;
    if (!emailToTest) {
      this.toast.error('No Gmail account connected. Please connect first.');
      return;
    }
    this.loading = true;
    this.apiService.sendTestEmail(emailToTest).subscribe({
      next: () => {
        this.toast.success(`Test email sent to ${emailToTest}!`);
        this.loading = false;
      },
      error: (err) => {
        const msg = err?.error?.error || err?.error?.message || 'Check backend logs.';
        this.toast.error(`Failed: ${msg}`);
        this.loading = false;
      }
    });
  }

  private parseTimeToInternal(time: string, type: 'reminder' | 'process') {
    if (!time) return;
    const [h24, m] = time.split(':');
    let h = parseInt(h24, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const hStr = h.toString().padStart(2, '0');
    if (type === 'reminder') {
      this.reminder_h = hStr; this.reminder_m = m; this.reminder_ampm = ampm;
    } else {
      this.process_h = hStr; this.process_m = m; this.process_ampm = ampm;
    }
  }

  updateReminderTime() {
    let h = parseInt(this.reminder_h, 10);
    if (this.reminder_ampm === 'PM' && h < 12) h += 12;
    if (this.reminder_ampm === 'AM' && h === 12) h = 0;
    this.automationData.reminderTime = `${h.toString().padStart(2, '0')}:${this.reminder_m}`;
  }

  updateProcessingTime() {
    let h = parseInt(this.process_h, 10);
    if (this.process_ampm === 'PM' && h < 12) h += 12;
    if (this.process_ampm === 'AM' && h === 12) h = 0;
    this.automationData.processingTime = `${h.toString().padStart(2, '0')}:${this.process_m}`;
  }

  runNow() {
    this.automationLoading = true;
    this.apiService.triggerForcedReminder().subscribe({
      next: () => {
        this.toast.success('Reminder email sent successfully!');
        this.automationLoading = false;
      },
      error: (err) => {
        const msg = err?.error?.error || 'Check backend SMTP settings.';
        this.toast.error(`Failed to send reminder: ${msg}`);
        this.automationLoading = false;
      }
    });
  }

  loadAutomationSettings() {
    this.apiService.getAutomationSettings().subscribe({
      next: (data) => {
        if (data) {
          this.automationData = data;
          this.parseTimeToInternal(data.reminderTime, 'reminder');
          this.parseTimeToInternal(data.processingTime, 'process');
        }
      },
      error: () => console.error('Failed to load automation settings')
    });
  }

  saveAutomationSettings() {
    this.automationLoading = true;
    this.apiService.saveAutomationSettings(this.automationData).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Automation settings saved successfully!');
        this.automationLoading = false;
      },
      error: () => {
        this.toast.error('Failed to save automation settings');
        this.automationLoading = false;
      }
    });
  }

  formatTime(time: string): string {
    if (!time) return '12:00 PM';
    try {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHours = h % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  }
}
