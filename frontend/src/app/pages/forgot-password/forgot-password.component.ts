import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4 overflow-hidden">
      <!-- Background Effects -->
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-mesh dark:bg-gradient-mesh-dark"></div>
        <div class="absolute inset-0 dot-pattern opacity-[0.03] dark:opacity-[0.04]"></div>
        <div class="absolute top-20 left-10 w-72 h-72 bg-primary-500/[0.04] dark:bg-primary-500/[0.06] rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/[0.03] dark:bg-accent-500/[0.04] rounded-full blur-3xl animate-float" style="animation-delay: 2s"></div>
      </div>

      <div class="w-full max-w-md relative z-10 animate-slide-up">
        <div class="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-8 lg:p-10 shadow-premium relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent"></div>

          <div class="text-center mb-8">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-5 shadow-lg shadow-amber-600/20">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </div>
            <h2 class="text-2xl font-sans font-extrabold text-[var(--text-primary)] tracking-tight">Forgot Password</h2>
            <p class="text-[var(--text-secondary)] mt-1.5 text-sm font-body">Enter your email to receive a reset link</p>
          </div>

          <div *ngIf="successMessage" class="mb-6 p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-center animate-scale-in">
            <div class="w-12 h-12 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 class="text-emerald-800 dark:text-emerald-300 font-bold font-sans mb-1">Link Sent!</h3>
            <p class="text-emerald-700 dark:text-emerald-400 text-sm font-body">{{ successMessage }}</p>
            <button routerLink="/login" class="mt-4 px-5 py-2 bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-all">Return to Login</button>
          </div>

          <form *ngIf="!successMessage" (ngSubmit)="submit()" #forgotForm="ngForm" class="space-y-4">
            <div>
              <label for="email" class="form-label">Email Address</label>
              <input type="email" id="email" name="email" [(ngModel)]="email" required class="input-field">
            </div>

            <div *ngIf="error" class="p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 rounded-xl flex items-center gap-3 animate-scale-in">
              <svg class="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-rose-700 dark:text-rose-400 text-sm font-medium">{{ error }}</p>
            </div>

            <button type="submit" [disabled]="!forgotForm.form.valid || loading"
                    class="btn-primary w-full py-3 text-sm font-bold">
              <span *ngIf="loading">Sending...</span>
              <span *ngIf="!loading">Send Reset Link</span>
            </button>
          </form>

          <div *ngIf="!successMessage" class="mt-8 text-center text-sm">
            <a routerLink="/login" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center justify-center gap-1.5 font-semibold">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
    email = '';
    loading = false;
    error = '';
    successMessage = '';

    constructor(private authService: AuthService) { }

    submit() {
        this.loading = true;
        this.error = '';

        this.authService.forgotPassword(this.email).subscribe({
            next: (res) => {
                this.loading = false;
                this.successMessage = res || 'If an account exists, a reset link has been sent.';
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || err.error || 'Failed to send reset link. Try again.';
            }
        });
    }
}
