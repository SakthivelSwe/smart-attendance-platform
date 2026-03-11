import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="mb-6">
        <h1 class="page-header text-3xl font-bold font-manrope text-slate-900 dark:text-white">Settings</h1>
        <p class="page-subtitle text-slate-500 font-inter">Configure your preferences and automation settings</p>
      </div>

      <div class="space-y-6 max-w-2xl">
        <!-- Gmail OAuth2 Section (Admin ONLY) -->
        <div class="glass-card p-6 stagger-1" *ngIf="authService.currentUser?.role === 'ADMIN'">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-primary-50 dark:bg-primary-900/40 rounded-lg text-primary-600 dark:text-primary-400">
              <span class="material-icons">mail</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white font-manrope">Gmail Account</h3>
              <p class="text-sm text-slate-500">Connect your Gmail to send automated emails</p>
            </div>
          </div>

          <!-- Connected State -->
          <div *ngIf="oauthStatus?.connected" class="space-y-4 animate-fade-in relative">
            <div class="alert-success">
              <span class="material-icons text-emerald-500 text-lg">check_circle</span>
              <div class="flex-1">
                <p class="text-sm font-semibold">Connected via Google</p>
                <p class="text-xs mt-0.5 opacity-80">{{ oauthStatus.email }}</p>
              </div>
              <span class="text-xs bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full font-bold">OAuth2</span>
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

            <p class="text-xs text-slate-500 text-center font-medium">
              ✅ No App Password needed. Emails are sent via Gmail API.
            </p>
          </div>

          <!-- Not Connected State -->
          <div *ngIf="!oauthStatus?.connected" class="space-y-4 animate-fade-in relative">
            <div class="alert-warning">
              <div class="flex-1">
                <p class="text-sm font-bold flex items-center gap-2"><span class="material-icons text-base">warning</span> No Gmail account connected</p>
                <p class="text-xs mt-1 opacity-80">
                  Click "Connect Gmail Account" to sign in with Google. No App Password required — just sign in once and emails will work automatically.
                </p>
              </div>
            </div>

            <button (click)="connectGmail()" [disabled]="loading"
                    class="btn-primary w-full py-3 h-12">
              <span *ngIf="loading" class="material-icons animate-spin text-sm">sync</span>
              <svg *ngIf="!loading" width="18" height="18" viewBox="0 0 24 24" class="mr-2">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{{ loading ? 'Redirecting to Google...' : 'Connect Gmail Account' }}</span>
            </button>

            <p class="text-xs text-slate-500 text-center font-medium">
              You'll be redirected to Google's secure sign-in page. We only request permission to send emails on your behalf.
            </p>
          </div>
        </div>

        <!-- Automation Preferences -->
        <div class="glass-card p-6 mt-6 stagger-2" *ngIf="authService.currentUser?.role === 'ADMIN'">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <span class="material-icons">schedule</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white font-manrope">Automation Timings & Reminders</h3>
              <p class="text-sm text-slate-500">Configure when tasks run and how you are notified</p>
            </div>
          </div>

          <div class="space-y-6">
            <div class="form-group flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <p class="font-bold text-slate-900 dark:text-white">Email Reminders</p>
                <p class="text-xs text-slate-500 font-medium">Receive an alert if chat export is missing</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="automationData.emailReminderEnabled" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <!-- Enhanced Time Selectors -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Reminder Time -->
              <div class="space-y-2">
                <label class="form-label !mb-2 text-primary-600 dark:text-primary-400">Reminder Check Time</label>
                <div class="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                  <span class="material-icons text-primary-400 text-sm">notifications_active</span>
                  <select [(ngModel)]="reminder_h" (change)="updateReminderTime()" class="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white w-16 cursor-pointer text-center tabular-nums">
                    <option *ngFor="let h of hours; trackBy: trackByHour" [value]="h" class="bg-white dark:bg-slate-800">{{ h }}</option>
                  </select>
                  <span class="text-slate-400 font-bold">:</span>
                  <select [(ngModel)]="reminder_m" (change)="updateReminderTime()" class="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white w-16 cursor-pointer text-center tabular-nums">
                    <option *ngFor="let m of minutes; trackBy: trackByMinute" [value]="m" class="bg-white dark:bg-slate-800">{{ m }}</option>
                  </select>
                  <select [(ngModel)]="reminder_ampm" (change)="updateReminderTime()" class="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border-none outline-none text-xs font-bold rounded px-2 py-1 cursor-pointer">
                    <option value="AM" class="bg-white dark:bg-slate-800">AM</option>
                    <option value="PM" class="bg-white dark:bg-slate-800">PM</option>
                  </select>
                </div>
              </div>

              <!-- Processing Time -->
              <div class="space-y-2">
                <label class="form-label !mb-2 text-emerald-600 dark:text-emerald-400">Automatic Process Time</label>
                <div class="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                  <span class="material-icons text-emerald-400 text-sm">sync</span>
                  <select [(ngModel)]="process_h" (change)="updateProcessingTime()" class="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white w-16 cursor-pointer text-center tabular-nums">
                    <option *ngFor="let h of hours; trackBy: trackByHour" [value]="h" class="bg-white dark:bg-slate-800">{{ h }}</option>
                  </select>
                  <span class="text-slate-400 font-bold">:</span>
                  <select [(ngModel)]="process_m" (change)="updateProcessingTime()" class="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white w-16 cursor-pointer text-center tabular-nums">
                    <option *ngFor="let m of minutes; trackBy: trackByMinute" [value]="m" class="bg-white dark:bg-slate-800">{{ m }}</option>
                  </select>
                  <select [(ngModel)]="process_ampm" (change)="updateProcessingTime()" class="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-none outline-none text-xs font-bold rounded px-2 py-1 cursor-pointer">
                    <option value="AM" class="bg-white dark:bg-slate-800">AM</option>
                    <option value="PM" class="bg-white dark:bg-slate-800">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex gap-3 mt-4">
              <button (click)="saveAutomationSettings()" [disabled]="automationLoading"
                      class="btn-primary flex-1 py-3 h-12">
                <span *ngIf="automationLoading" class="material-icons animate-spin text-sm">sync</span>
                <span class="font-bold underline-offset-4 decoration-primary-300 decoration-2 transition-all">Save Scheduler Policy</span>
              </button>

              <button (click)="runNow()" [disabled]="automationLoading"
                      class="btn-secondary px-6 h-12"
                      title="Run manual check now">
                <span class="material-icons text-sm">play_circle</span>
                <span>Run Now</span>
              </button>
            </div>
          </div>
        </div>


        <!-- Appearance -->
        <div class="glass-card p-6 mt-6 stagger-3">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 font-manrope">Appearance</h3>
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div>
              <p class="font-semibold text-slate-900 dark:text-white">Dark Mode</p>
              <p class="text-sm text-slate-500 font-medium">Toggle between light and dark themes</p>
            </div>
            <button (click)="themeService.toggleTheme()"
                    class="relative w-14 h-7 rounded-full transition-colors duration-300"
                    [class.bg-primary-600]="themeService.isDark"
                    [class.bg-slate-300]="!themeService.isDark">
              <span class="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300"
                    [class.translate-x-7]="themeService.isDark"></span>
            </button>
          </div>
        </div>

        <!-- Account -->
        <div class="glass-card p-6 stagger-4" *ngIf="authService.currentUser as user">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 font-manrope">Account</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name + '&background=1f3a5f&color=fff'"
                   class="w-14 h-14 rounded-xl ring-2 ring-primary-500/20" [alt]="user.name"/>
              <div>
                <p class="font-bold text-slate-900 dark:text-white text-lg font-manrope">{{ user.name }}</p>
                <p class="text-sm text-slate-500 font-medium">{{ user.email }}</p>
                <span class="inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest"
                      [class.bg-primary-100]="user.role === 'ADMIN'" [class.text-primary-700]="user.role === 'ADMIN'"
                      [class.bg-slate-200]="user.role !== 'ADMIN'" [class.text-slate-700]="user.role !== 'ADMIN'">
                  {{ user.role }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="glass-card p-6 stagger-5">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 font-manrope">About</h3>
          <div class="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <p><span class="font-bold text-slate-900 dark:text-white">Application:</span> Smart Attendance Automation Platform</p>
            <p><span class="font-bold text-slate-900 dark:text-white">Version:</span> 1.0.0</p>
            <p><span class="font-bold text-slate-900 dark:text-white">Frontend:</span> Angular 17.3 + TailwindCSS</p>
            <p><span class="font-bold text-slate-900 dark:text-white">Automation:</span> WhatsApp + Gmail Integration</p>
          </div>
        </div>

        <button (click)="authService.logout()" class="btn-danger w-full h-12 stagger-6">Sign Out</button>
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
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  trackByHour(index: number, item: string): string { return item; }
  trackByMinute(index: number, item: string): string { return item; }

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
      next: (status) => {
        this.oauthStatus = status;
        this.cdr.markForCheck();
      },
      error: () => {
        this.oauthStatus = { connected: false, email: '' };
        this.cdr.markForCheck();
      }
    });
  }

  connectGmail() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getGmailOAuthAuthUrl().subscribe({
      next: (res) => {
        // Redirect the browser to Google's OAuth2 consent page
        window.location.href = res.authUrl;
      },
      error: () => {
        this.toast.error('Failed to start Gmail authentication. Please try again.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  disconnectGmail() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.disconnectGmailOAuth().subscribe({
      next: () => {
        this.toast.success('Gmail account disconnected.');
        this.oauthStatus = { connected: false, email: '' };
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to disconnect Gmail account.');
        this.loading = false;
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
    this.apiService.sendTestEmail(emailToTest).subscribe({
      next: () => {
        this.toast.success(`Test email sent to ${emailToTest}!`);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err?.error?.error || err?.error?.message || 'Check backend logs.';
        this.toast.error(`Failed: ${msg}`);
        this.loading = false;
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
    this.apiService.triggerForcedReminder().subscribe({
      next: () => {
        this.toast.success('Reminder email sent successfully!');
        this.automationLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err?.error?.error || 'Check backend SMTP settings.';
        this.toast.error(`Failed to send reminder: ${msg}`);
        this.automationLoading = false;
        this.cdr.markForCheck();
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
          this.cdr.markForCheck();
        }
      },
      error: () => console.error('Failed to load automation settings')
    });
  }

  saveAutomationSettings() {
    this.automationLoading = true;
    this.cdr.markForCheck();
    this.apiService.saveAutomationSettings(this.automationData).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Automation settings saved successfully!');
        this.automationLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to save automation settings');
        this.automationLoading = false;
        this.cdr.markForCheck();
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
