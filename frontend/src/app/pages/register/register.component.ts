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
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4 overflow-hidden">
      <!-- Background Effects -->
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-mesh dark:bg-gradient-mesh-dark"></div>
        <div class="absolute inset-0 dot-pattern opacity-[0.03] dark:opacity-[0.04]"></div>
        <div class="absolute top-20 right-10 w-72 h-72 bg-primary-500/[0.04] dark:bg-primary-500/[0.06] rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-20 left-10 w-96 h-96 bg-accent-500/[0.03] dark:bg-accent-500/[0.04] rounded-full blur-3xl animate-float" style="animation-delay: 3s"></div>
      </div>

      <div class="w-full max-w-md relative z-10 animate-slide-up">
        <div class="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-8 lg:p-10 shadow-premium relative overflow-hidden">

          <!-- Subtle top gradient line -->
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent"></div>

          <div class="text-center mb-8">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mb-5 shadow-lg shadow-primary-600/20">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
            <h2 class="text-2xl font-sans font-extrabold text-[var(--text-primary)] tracking-tight">Create an Account</h2>
            <p class="text-[var(--text-secondary)] mt-1.5 text-sm font-body">Join Smart Attendance to track seamlessly</p>
          </div>

          <div *ngIf="successMessage" class="mb-6 p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-center animate-scale-in">
            <div class="w-12 h-12 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-emerald-800 dark:text-emerald-300 font-bold font-sans mb-1">Registration Successful!</h3>
            <p class="text-emerald-700 dark:text-emerald-400 text-sm font-body">{{ successMessage }}</p>
            <button routerLink="/login" class="mt-4 px-5 py-2 bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-all">Return to Login</button>
          </div>

          <form *ngIf="!successMessage" (ngSubmit)="register()" #registerForm="ngForm" class="space-y-4">
            <div>
              <label for="name" class="form-label">Full Name</label>
              <input type="text" id="name" name="name" [(ngModel)]="name" required #nameInput="ngModel"
                     [ngClass]="{'border-rose-500 ring-rose-500/30 ring-2': nameInput.invalid && (nameInput.dirty || nameInput.touched)}"
                     class="input-field">
              <div *ngIf="nameInput.invalid && (nameInput.dirty || nameInput.touched)" class="mt-1.5 text-xs text-rose-500 font-medium">
                <span *ngIf="nameInput.errors?.['required']">Name is required.</span>
              </div>
            </div>
            <div>
              <label for="email" class="form-label">Email Address</label>
              <input type="email" id="email" name="email" [(ngModel)]="email" required email #emailInput="ngModel"
                     [ngClass]="{'border-rose-500 ring-rose-500/30 ring-2': emailInput.invalid && (emailInput.dirty || emailInput.touched)}"
                     class="input-field">
              <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="mt-1.5 text-xs text-rose-500 font-medium">
                <span *ngIf="emailInput.errors?.['required']">Email is required.</span>
                <span *ngIf="emailInput.errors?.['email']">Please enter a valid email address.</span>
              </div>
            </div>
            <div>
              <label for="password" class="form-label">Password</label>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="password" required minlength="6" #passwordInput="ngModel"
                       [ngClass]="{'border-rose-500 ring-rose-500/30 ring-2': passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)}"
                       class="input-field pr-11">
                <button type="button" (click)="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  <svg *ngIf="!showPassword" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showPassword" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <div *ngIf="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)" class="mt-1.5 text-xs text-rose-500 font-medium">
                <span *ngIf="passwordInput.errors?.['required']">Password is required.</span>
                <span *ngIf="passwordInput.errors?.['minlength']">Password must be at least 6 characters long.</span>
              </div>
            </div>
            <div>
              <label for="confirmPassword" class="form-label">Confirm Password</label>
              <div class="relative">
                <input [type]="showConfirmPassword ? 'text' : 'password'" id="confirmPassword" name="confirmPassword" [(ngModel)]="confirmPassword" required #confirmInput="ngModel"
                       [ngClass]="{'border-rose-500 ring-rose-500/30 ring-2': (confirmInput.invalid || password !== confirmPassword) && (confirmInput.dirty || confirmInput.touched)}"
                       class="input-field pr-11">
                <button type="button" (click)="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  <svg *ngIf="!showConfirmPassword" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showConfirmPassword" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <div *ngIf="(confirmInput.invalid || password !== confirmPassword) && (confirmInput.dirty || confirmInput.touched)" class="mt-1.5 text-xs text-rose-500 font-medium">
                <span *ngIf="confirmInput.errors?.['required']">Please confirm your password.</span>
                <span *ngIf="!confirmInput.errors?.['required'] && password !== confirmPassword">Passwords do not match.</span>
              </div>
            </div>

            <div *ngIf="error" class="p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 rounded-xl flex items-center gap-3 animate-scale-in">
              <svg class="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-rose-700 dark:text-rose-400 text-sm font-medium">{{ error }}</p>
            </div>

            <button type="submit" [disabled]="!registerForm.form.valid || loading || password !== confirmPassword"
                    class="btn-primary w-full py-3 text-sm font-bold mt-2">
              <span *ngIf="loading">Creating account...</span>
              <span *ngIf="!loading">Register</span>
            </button>
          </form>

          <div *ngIf="!successMessage" class="mt-8 text-center text-sm">
            <span class="text-[var(--text-secondary)] font-body">Already have an account? </span>
            <a routerLink="/login" class="text-primary-600 dark:text-primary-400 font-bold hover:underline">Sign in here</a>
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
            errorMessage = err.error.message || err.error.error || errorMessage;
          }
        }

        if (errorMessage === 'Email already registered' || errorMessage.includes('already registered')) {
          this.error = "Email already registered (possibly via Google). Please 'Sign in here' and use Continue with Google.";
        } else {
          this.error = errorMessage;
        }
      }
    });
  }
}
