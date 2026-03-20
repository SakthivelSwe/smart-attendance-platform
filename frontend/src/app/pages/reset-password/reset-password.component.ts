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
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4 overflow-hidden">
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-mesh dark:bg-gradient-mesh-dark"></div>
        <div class="absolute inset-0 dot-pattern opacity-[0.03] dark:opacity-[0.04]"></div>
        <div class="absolute top-20 right-10 w-72 h-72 bg-primary-500/[0.04] dark:bg-primary-500/[0.06] rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-20 left-10 w-96 h-96 bg-accent-500/[0.03] dark:bg-accent-500/[0.04] rounded-full blur-3xl animate-float" style="animation-delay: 3s"></div>
      </div>

      <div class="w-full max-w-md relative z-10 animate-slide-up">
        <div class="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-8 lg:p-10 shadow-premium relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent"></div>

          <div class="text-center mb-8">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mb-5 shadow-lg shadow-primary-600/20">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h2 class="text-2xl font-sans font-extrabold text-[var(--text-primary)] tracking-tight">Set New Password</h2>
            <p class="text-[var(--text-secondary)] mt-1.5 text-sm font-body">Please enter your new password</p>
          </div>

          <div *ngIf="noTokenError" class="flex flex-col items-center animate-scale-in">
            <div class="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="text-rose-600 dark:text-rose-400 mt-2 mb-6 text-center text-sm font-medium">{{ noTokenError }}</p>
            <button routerLink="/forgot-password" class="btn-secondary w-full">Request New Link</button>
          </div>

          <form *ngIf="!noTokenError" (ngSubmit)="reset()" #resetForm="ngForm" class="space-y-4">
            <div>
              <label for="newPassword" class="form-label">New Password</label>
              <input type="password" id="newPassword" name="newPassword" [(ngModel)]="newPassword" required minlength="6" class="input-field">
            </div>
            <div>
              <label for="confirmPassword" class="form-label">Confirm New Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" [(ngModel)]="confirmPassword" required class="input-field">
            </div>

            <div *ngIf="error" class="p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 rounded-xl flex items-center gap-3 animate-scale-in">
              <svg class="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-rose-700 dark:text-rose-400 text-sm font-medium">{{ error }}</p>
            </div>

            <button type="submit" [disabled]="!resetForm.form.valid || loading || newPassword !== confirmPassword"
                    class="btn-primary w-full py-3 text-sm font-bold">
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
