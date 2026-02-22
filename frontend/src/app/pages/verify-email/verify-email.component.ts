import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4">
      <div class="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.8),rgba(0,0,0,0.2))] bg-[bottom_1px_center] z-0"></div>

      <div class="w-full max-w-md relative z-10 animate-slide-up">
        <div class="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-8 lg:p-10 shadow-lg text-center relative overflow-hidden">
          
          <div *ngIf="loading" class="flex flex-col items-center">
            <svg class="animate-spin h-10 w-10 text-primary-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <h2 class="text-xl font-bold text-[var(--text-primary)]">Verifying your email...</h2>
            <p class="text-[var(--text-secondary)] mt-2">Please wait a moment while we confirm your email address.</p>
          </div>

          <div *ngIf="!loading && success" class="flex flex-col items-center animate-fade-in">
            <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-[var(--text-primary)]">Email Verified!</h2>
            <p class="text-[var(--text-secondary)] mt-2 mb-6">{{ message }}</p>
            <button routerLink="/login" class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
              Continue to Login
            </button>
          </div>

          <div *ngIf="!loading && !success" class="flex flex-col items-center animate-fade-in">
            <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-[var(--text-primary)]">Verification Failed</h2>
            <p class="text-red-600 dark:text-red-400 mt-2 mb-6">{{ message }}</p>
            <button routerLink="/login" class="px-6 py-2 bg-surface-100 dark:bg-surface-800 text-[var(--text-primary)] hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg font-medium transition-colors">
              Return to Login
            </button>
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
