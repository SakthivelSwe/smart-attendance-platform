import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
      <div class="mb-6">
        <h1 class="page-header">Settings</h1>
        <p class="page-subtitle">Configure your preferences and automation settings</p>
      </div>

      <div class="space-y-6 max-w-2xl">
        <!-- Automation Settings (Admin ONLY) -->
        <div class="card p-6 border-2 border-primary-500/20" *ngIf="authService.currentUser?.role === 'ADMIN'">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-primary-100 rounded-lg text-primary-600">
              <span class="material-icons">robot</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">WhatsApp Automation</h3>
              <p class="text-sm text-[var(--text-secondary)]">Configure Gmail for automatic chat fetching</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="p-4 rounded-xl bg-primary-50 border border-primary-100 mb-4" *ngIf="gmailStatus?.configured">
               <div class="flex items-center gap-2 text-primary-700">
                 <span class="material-icons text-sm">check_circle</span>
                 <span class="text-sm font-medium">Currently linked to: {{ gmailStatus.email }}</span>
               </div>
               <p class="text-xs text-primary-600 mt-1 ml-6">Automated fetching is ACTIVE (Mon-Fri 12PM, Sat 7PM)</p>
            </div>

            <div class="space-y-4">
                <div class="form-group">
                  <label class="label">Gmail Address</label>
                  <input type="email" [(ngModel)]="gmailData.email" class="input" placeholder="example@gmail.com">
                </div>
                <div class="form-group">
                  <label class="label">Gmail App Password</label>
                  <input type="password" [(ngModel)]="gmailData.appPassword" class="input" placeholder="xxxx xxxx xxxx xxxx">
                  <p class="text-xs text-[var(--text-secondary)] mt-1">
                    Use a 16-character App Password from Google Account settings.
                  </p>
                </div>
                
                <button (click)="saveGmail()" [disabled]="loading || !gmailData.email || !gmailData.appPassword" 
                        class="btn-primary w-full flex items-center justify-center gap-2">
                  <span *ngIf="loading" class="material-icons animate-spin text-sm">sync</span>
                  <span>{{ gmailStatus?.configured ? 'Update Credentials' : 'Save & Enable Automation' }}</span>
                </button>
                
                <button (click)="testEmail()" [disabled]="loading" *ngIf="gmailStatus?.configured || gmailData.email"
                        class="btn-secondary w-full flex items-center justify-center gap-2">
                  <span class="material-icons text-sm">send</span>
                  <span>Send Test Email</span>
                </button>
            </div>
          </div>
        </div>

        <!-- Appearance -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Appearance</h3>
          <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)]">
            <div>
              <p class="font-medium text-[var(--text-primary)]">Dark Mode</p>
              <p class="text-sm text-[var(--text-secondary)]">Toggle between light and dark themes</p>
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
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Account</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)]">
              <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name + '&background=6366f1&color=fff'"
                   class="w-14 h-14 rounded-xl ring-2 ring-primary-500/20" [alt]="user.name"/>
              <div>
                <p class="font-semibold text-[var(--text-primary)] text-lg">{{ user.name }}</p>
                <p class="text-sm text-[var(--text-secondary)]">{{ user.email }}</p>
                <span class="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class.bg-primary-100]="user.role === 'ADMIN'" [class.text-primary-700]="user.role === 'ADMIN'"
                      [class.bg-surface-100]="user.role !== 'ADMIN'" [class.text-surface-700]="user.role !== 'ADMIN'">
                  {{ user.role }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">About</h3>
          <div class="space-y-2 text-sm text-[var(--text-secondary)]">
            <p><span class="font-medium">Application:</span> Smart Attendance Automation Platform</p>
            <p><span class="font-medium">Version:</span> 1.0.0</p>
            <p><span class="font-medium">Frontend:</span> Angular 17</p>
            <p><span class="font-medium">Automation:</span> WhatsApp + Gmail Integration</p>
          </div>
        </div>

        <button (click)="authService.logout()" class="btn-danger w-full">Sign Out</button>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  gmailData = { email: '', appPassword: '' };
  gmailStatus: any = null;
  loading = false;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private apiService: ApiService,
    private toast: ToastService
  ) { }

  ngOnInit() {
    if (this.authService.currentUser?.role === 'ADMIN') {
      this.loadGmailStatus();
    }
  }

  loadGmailStatus() {
    this.apiService.getGmailStatus().subscribe({
      next: (status) => {
        this.gmailStatus = status;
        if (status.configured && status.email) {
          this.gmailData.email = status.email;
        }
      },
      error: () => console.error('Failed to load Gmail status')
    });
  }

  testEmail() {
    const emailToTest = this.gmailData.email;
    if (!emailToTest) {
      this.toast.error('Please enter an email address first');
      return;
    }

    this.loading = true;
    this.apiService.sendTestEmail(emailToTest).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Test email sent successfully');
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to send test email. Check backend logs.');
        this.loading = false;
      }
    });
  }

  saveGmail() {
    this.loading = true;
    this.apiService.saveGmailCredentials(this.gmailData).subscribe({
      next: (res) => {
        this.toast.success('Gmail credentials saved! Automation is now active.');
        this.gmailData.appPassword = ''; // Clear password field
        this.loadGmailStatus();
        this.loading = false;
      },
      error: (err) => {
        this.toast.error('Failed to save credentials');
        this.loading = false;
      }
    });
  }
}
