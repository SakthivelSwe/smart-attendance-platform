import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4">
      <div class="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.8),rgba(0,0,0,0.2))] bg-[bottom_1px_center] z-0"></div>

      <div class="w-full max-w-md relative z-10 animate-slide-up">
        <div class="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-8 lg:p-10 shadow-lg relative overflow-hidden">
          
          <div class="text-center mb-8">
            <h2 class="text-2xl font-sans font-bold text-[var(--text-primary)] tracking-tight">Set New Password</h2>
            <p class="text-[var(--text-secondary)] mt-1.5 text-sm">Please enter your new password</p>
          </div>

          <div *ngIf="noTokenError" class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="text-red-600 dark:text-red-400 mt-2 mb-6 text-center">{{ noTokenError }}</p>
            <button routerLink="/forgot-password" class="w-full px-6 py-2 bg-surface-100 dark:bg-surface-800 text-[var(--text-primary)] hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg font-medium transition-colors">
              Request New Link
            </button>
          </div>

          <form *ngIf="!noTokenError" (ngSubmit)="reset()" #resetForm="ngForm" class="space-y-4">
            <div>
              <label for="newPassword" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">New Password</label>
              <input type="password" id="newPassword" name="newPassword" [(ngModel)]="newPassword" required minlength="6"
                     class="w-full px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[var(--text-primary)]">
            </div>
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Confirm New Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" [(ngModel)]="confirmPassword" required
                     class="w-full px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[var(--text-primary)]">
            </div>

            <div *ngIf="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-3 animate-fade-in">
              <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-red-700 dark:text-red-400 text-sm">{{ error }}</p>
            </div>

            <button type="submit" [disabled]="!resetForm.form.valid || loading || newPassword !== confirmPassword"
                    class="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="loading">Updating...</span>
              <span *ngIf="!loading">Update Password</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
    token = '';
    newPassword = '';
    confirmPassword = '';

    loading = false;
    error = '';
    noTokenError = '';

    constructor(
        private route: ActivatedRoute,
        private authService: AuthService,
        private router: Router,
        private toast: ToastService
    ) { }

    ngOnInit() {
        const t = this.route.snapshot.queryParamMap.get('token');
        if (!t) {
            this.noTokenError = 'Reset token is missing from the link.';
        } else {
            this.token = t;
        }
    }

    reset() {
        if (this.newPassword !== this.confirmPassword) {
            this.error = "Passwords do not match.";
            return;
        }

        this.loading = true;
        this.error = '';

        const data = {
            token: this.token,
            newPassword: this.newPassword
        };

        this.authService.resetPassword(data).subscribe({
            next: (res) => {
                this.loading = false;
                this.toast.success('Password updated successfully!');
                this.router.navigate(['/login']);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || err.error || 'Failed to reset password. The token may be expired.';
            }
        });
    }
}
