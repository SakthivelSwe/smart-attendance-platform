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
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4">
      <div class="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.8),rgba(0,0,0,0.2))] bg-[bottom_1px_center] z-0"></div>

      <div class="w-full max-w-md relative z-10 animate-slide-up">
        <div class="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-8 lg:p-10 shadow-lg relative overflow-hidden">
          
          <div class="text-center mb-8">
            <h2 class="text-2xl font-sans font-bold text-[var(--text-primary)] tracking-tight">Forgot Password</h2>
            <p class="text-[var(--text-secondary)] mt-1.5 text-sm">Enter your email to receive a reset link</p>
          </div>

          <div *ngIf="successMessage" class="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center animate-fade-in">
            <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <h3 class="text-emerald-800 dark:text-emerald-300 font-semibold mb-1">Link Sent!</h3>
            <p class="text-emerald-700 dark:text-emerald-400 text-sm">{{ successMessage }}</p>
            <button routerLink="/login" class="mt-4 w-full px-4 py-2 bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 rounded text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-700 transition">Return to Login</button>
          </div>

          <form *ngIf="!successMessage" (ngSubmit)="submit()" #forgotForm="ngForm" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
              <input type="email" id="email" name="email" [(ngModel)]="email" required
                     class="w-full px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[var(--text-primary)]">
            </div>

            <div *ngIf="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-3 animate-fade-in">
              <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-red-700 dark:text-red-400 text-sm">{{ error }}</p>
            </div>

            <button type="submit" [disabled]="!forgotForm.form.valid || loading"
                    class="w-full py-2.5 px-4 mt-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="loading">Sending...</span>
              <span *ngIf="!loading">Send Reset Link</span>
            </button>
          </form>

          <div *ngIf="!successMessage" class="mt-8 text-center text-sm">
            <a routerLink="/login" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center justify-center gap-1">
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
