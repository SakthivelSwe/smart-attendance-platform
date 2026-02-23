import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4">
      <div class="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.8),rgba(0,0,0,0.2))] bg-[bottom_1px_center] z-0"></div>

      <div class="w-full max-w-md relative z-10 animate-slide-up">
        <div class="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-8 lg:p-10 shadow-lg relative overflow-hidden">
          
          <div class="text-center mb-8">
            <h2 class="text-2xl font-sans font-bold text-[var(--text-primary)] tracking-tight">Create an Account</h2>
            <p class="text-[var(--text-secondary)] mt-1.5 text-sm">Join Smart Attendance to track seamlessly</p>
          </div>

          <div *ngIf="successMessage" class="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center animate-fade-in">
            <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="text-emerald-800 dark:text-emerald-300 font-semibold mb-1">Registration Successful!</h3>
            <p class="text-emerald-700 dark:text-emerald-400 text-sm">{{ successMessage }}</p>
            <button routerLink="/login" class="mt-4 px-4 py-2 bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 rounded text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-700 transition">Return to Login</button>
          </div>

          <form *ngIf="!successMessage" (ngSubmit)="register()" #registerForm="ngForm" class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Full Name</label>
              <input type="text" id="name" name="name" [(ngModel)]="name" required #nameInput="ngModel"
                     [ngClass]="{'border-red-500 ring-red-500 text-red-600': nameInput.invalid && (nameInput.dirty || nameInput.touched)}"
                     class="w-full px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[var(--text-primary)]">
              <div *ngIf="nameInput.invalid && (nameInput.dirty || nameInput.touched)" class="mt-1 text-sm text-red-500">
                <span *ngIf="nameInput.errors?.['required']">Name is required.</span>
              </div>
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
              <input type="email" id="email" name="email" [(ngModel)]="email" required email #emailInput="ngModel"
                     [ngClass]="{'border-red-500 ring-red-500 text-red-600': emailInput.invalid && (emailInput.dirty || emailInput.touched)}"
                     class="w-full px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[var(--text-primary)]">
              <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="mt-1 text-sm text-red-500">
                <span *ngIf="emailInput.errors?.['required']">Email is required.</span>
                <span *ngIf="emailInput.errors?.['email']">Please enter a valid email address.</span>
              </div>
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="password" required minlength="6" #passwordInput="ngModel"
                       [ngClass]="{'border-red-500 ring-red-500 text-red-600': passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)}"
                       class="w-full px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[var(--text-primary)] pr-10">
                <button type="button" (click)="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <svg *ngIf="!showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <div *ngIf="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)" class="mt-1 text-sm text-red-500">
                <span *ngIf="passwordInput.errors?.['required']">Password is required.</span>
                <span *ngIf="passwordInput.errors?.['minlength']">Password must be at least 6 characters long.</span>
              </div>
            </div>
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Confirm Password</label>
              <div class="relative">
                <input [type]="showConfirmPassword ? 'text' : 'password'" id="confirmPassword" name="confirmPassword" [(ngModel)]="confirmPassword" required #confirmInput="ngModel"
                       [ngClass]="{'border-red-500 ring-red-500 text-red-600': (confirmInput.invalid || password !== confirmPassword) && (confirmInput.dirty || confirmInput.touched)}"
                       class="w-full px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[var(--text-primary)] pr-10">
                <button type="button" (click)="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <svg *ngIf="!showConfirmPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showConfirmPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <div *ngIf="(confirmInput.invalid || password !== confirmPassword) && (confirmInput.dirty || confirmInput.touched)" class="mt-1 text-sm text-red-500">
                <span *ngIf="confirmInput.errors?.['required']">Please confirm your password.</span>
                <span *ngIf="!confirmInput.errors?.['required'] && password !== confirmPassword">Passwords do not match.</span>
              </div>
            </div>

            <div *ngIf="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-3 animate-fade-in">
              <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-red-700 dark:text-red-400 text-sm">{{ error }}</p>
            </div>

            <button type="submit" [disabled]="!registerForm.form.valid || loading || password !== confirmPassword"
                    class="w-full py-2.5 px-4 mt-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="loading">Creating account...</span>
              <span *ngIf="!loading">Register</span>
            </button>
          </form>

          <div *ngIf="!successMessage" class="mt-8 text-center text-sm">
            <span class="text-[var(--text-secondary)]">Already have an account? </span>
            <a routerLink="/login" class="text-primary-600 dark:text-primary-400 font-medium hover:underline">Sign in here</a>
          </div>

        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;

  loading = false;
  error = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) { }

  register() {
    if (this.password !== this.confirmPassword) {
      this.error = "Passwords do not match.";
      return;
    }

    this.loading = true;
    this.error = '';

    const data = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.authService.register(data).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = 'You can now log in with your credentials.';
        this.toast.success('Registration successful!');
      },
      error: (err) => {
        this.loading = false;
        let errorMessage = 'Registration failed. Please try again.';
        if (err.error) {
          if (typeof err.error === 'string') {
            try {
              const parsed = JSON.parse(err.error);
              errorMessage = parsed.message || errorMessage;
            } catch (e) {
              errorMessage = err.error;
            }
          } else {
            errorMessage = err.error.message || errorMessage;
          }
        }
        this.error = errorMessage;
      }
    });
  }
}
