import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4 overflow-hidden">
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-mesh dark:bg-gradient-mesh-dark"></div>
        <div class="absolute inset-0 dot-pattern opacity-[0.03] dark:opacity-[0.04]"></div>
        <div class="absolute top-20 left-10 w-72 h-72 bg-primary-500/[0.04] dark:bg-primary-500/[0.06] rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/[0.03] dark:bg-accent-500/[0.04] rounded-full blur-3xl animate-float" style="animation-delay: 2s"></div>
      </div>

      <div class="w-full max-w-md relative z-10 animate-slide-up">
        <div class="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-8 lg:p-10 shadow-premium text-center relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent"></div>

          <div *ngIf="loading" class="flex flex-col items-center py-4">
            <div class="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-5">
              <svg class="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
            <h2 class="text-xl font-extrabold text-[var(--text-primary)] font-sans tracking-tight">Verifying your email...</h2>
            <p class="text-[var(--text-secondary)] mt-2 text-sm font-body">Please wait a moment while we confirm your email address.</p>
          </div>

          <div *ngIf="!loading && success" class="flex flex-col items-center animate-scale-in py-4">
            <div class="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5">
              <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-extrabold text-[var(--text-primary)] font-sans tracking-tight">Email Verified!</h2>
            <p class="text-[var(--text-secondary)] mt-2 mb-6 text-sm font-body">{{ message }}</p>
            <button routerLink="/login" class="btn-primary w-full py-3 text-sm font-bold">Continue to Login</button>
          </div>

          <div *ngIf="!loading && !success" class="flex flex-col items-center animate-scale-in py-4">
            <div class="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5">
              <svg class="w-8 h-8 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-extrabold text-[var(--text-primary)] font-sans tracking-tight">Verification Failed</h2>
            <p class="text-rose-600 dark:text-rose-400 mt-2 mb-6 text-sm font-medium">{{ message }}</p>
            <button routerLink="/login" class="btn-secondary w-full">Return to Login</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
    loading = true;
    success = false;
    message = '';

    constructor(
        private route: ActivatedRoute,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const token = this.route.snapshot.queryParamMap.get('token');
        if (!token) {
            this.loading = false;
            this.success = false;
            this.message = 'Verification token is missing from the link.';
            return;
        }

        this.authService.verifyEmail(token).subscribe({
            next: (res) => {
                this.loading = false;
                this.success = true;
                this.message = res || 'Your email has been verified successfully.';
            },
            error: (err) => {
                this.loading = false;
                this.success = false;
                this.message = err.error?.message || err.error || 'The verification link is invalid or has expired.';
            }
        });
    }
}
