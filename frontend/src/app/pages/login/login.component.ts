import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4 overflow-hidden">

      <!-- Background Effects -->
      <div class="absolute inset-0 z-0">
        <!-- Gradient mesh -->
        <div class="absolute inset-0 bg-gradient-mesh dark:bg-gradient-mesh-dark"></div>
        <!-- Dot pattern -->
        <div class="absolute inset-0 dot-pattern opacity-[0.03] dark:opacity-[0.04]"></div>
        <!-- Floating shapes -->
        <div class="absolute top-20 left-10 w-72 h-72 bg-primary-500/[0.04] dark:bg-primary-500/[0.06] rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/[0.03] dark:bg-accent-500/[0.04] rounded-full blur-3xl animate-float" style="animation-delay: 2s"></div>
        <div class="absolute top-1/2 left-1/3 w-64 h-64 bg-primary-400/[0.03] rounded-full blur-3xl animate-float" style="animation-delay: 4s"></div>
      </div>

      <!-- Main Content Container -->
      <div class="relative z-10 w-full max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12 lg:gap-20">

        <!-- Left Side: Hero Text -->
        <div class="hidden md:block flex-1 space-y-8 animate-fade-in">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/40 rounded-full mb-4">
            <span class="w-2 h-2 rounded-full bg-primary-500 animate-glow-pulse"></span>
            <span class="text-xs font-bold text-primary-600 dark:text-primary-400 tracking-wide">SMART AUTOMATION</span>
          </div>
          <h1 class="text-5xl lg:text-6xl font-sans font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1]">
            Attendance <br>
            <span class="gradient-text">Automation</span>
          </h1>
          <p class="text-lg text-[var(--text-secondary)] max-w-md leading-relaxed font-body">
            Empower your workforce with AI-driven tracking. Effortless, accurate, and integrated directly with your workflow.
          </p>
          <div class="flex items-center gap-4 pt-2">
             <div class="flex -space-x-2.5">
               <div class="w-9 h-9 rounded-xl border-2 border-[var(--bg-primary)] bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm">AI</div>
               <div class="w-9 h-9 rounded-xl border-2 border-[var(--bg-primary)] bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm">HR</div>
               <div class="w-9 h-9 rounded-xl border-2 border-[var(--bg-primary)] bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm">IT</div>
             </div>
             <div class="text-sm font-semibold text-[var(--text-secondary)]">Trusted by modern teams</div>
          </div>
        </div>

        <!-- Right Side: Login Card -->
        <div class="w-full max-w-md animate-slide-up">
          <div class="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-8 lg:p-10 shadow-premium relative overflow-hidden">

            <!-- Subtle top gradient line -->
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent"></div>

            <!-- Logo Area -->
            <div class="text-center mb-8">
              <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mb-5 shadow-lg shadow-primary-600/20">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 class="text-2xl font-sans font-extrabold text-[var(--text-primary)] tracking-tight">Welcome Back</h2>
              <p class="text-[var(--text-secondary)] mt-1.5 text-sm font-body">Sign in to your workspace</p>
            </div>

            <!-- Email/Password Login Form -->
            <form (ngSubmit)="loginWithEmail()" #loginForm="ngForm" class="space-y-4 mb-6">
              <div>
                <label for="email" class="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider font-sans">Email Address</label>
                <input type="email" id="email" name="email" [(ngModel)]="email" required email #emailInput="ngModel"
                       [ngClass]="{'border-rose-500 ring-rose-500/30 ring-2': emailInput.invalid && (emailInput.dirty || emailInput.touched)}"
                       class="input-field">
                <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="mt-1.5 text-xs text-rose-500 font-medium">
                  <span *ngIf="emailInput.errors?.['required']">Email is required.</span>
                  <span *ngIf="emailInput.errors?.['email']">Please enter a valid email address.</span>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label for="password" class="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-sans">Password</label>
                  <a routerLink="/forgot-password" class="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold">Forgot password?</a>
                </div>
                <div class="relative">
                  <input [type]="showPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="password" required #passwordInput="ngModel"
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
                </div>
              </div>
              <button type="submit" [disabled]="!loginForm.form.valid || loading"
                      class="btn-primary w-full py-3 text-sm font-bold">
                Sign In
              </button>
            </form>

            <div class="relative flex py-2 items-center mb-6">
              <div class="flex-grow border-t border-[var(--border-subtle)]"></div>
              <span class="flex-shrink-0 mx-4 text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">Or continue with</span>
              <div class="flex-grow border-t border-[var(--border-subtle)]"></div>
            </div>

            <!-- Google Sign In -->
            <div class="flex justify-center">
               <div id="googleSignInButton" class="w-full flex justify-center"></div>
            </div>

            <div *ngIf="loading" class="flex justify-center mt-6">
              <div class="flex items-center gap-3 text-primary-500">
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span class="text-sm font-semibold">Authenticating...</span>
              </div>
            </div>

            <div *ngIf="error" class="mt-4 p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 rounded-xl flex items-center gap-3 animate-scale-in">
              <svg class="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-rose-700 dark:text-rose-400 text-sm font-medium">{{ error }}</p>
            </div>

            <div class="mt-8 text-center text-sm">
              <span class="text-[var(--text-secondary)] font-body">Don't have an account? </span>
              <a routerLink="/register" class="text-primary-600 dark:text-primary-400 font-bold hover:underline">Register here</a>
            </div>

            <div class="mt-6 text-center">
              <p class="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.15em] font-semibold">
                <a href="#" class="hover:text-[var(--text-secondary)] transition-colors">Terms</a> · <a href="#" class="hover:text-[var(--text-secondary)] transition-colors">Privacy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loading = false;
  error = '';
  email = '';
  password = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private toast: ToastService
  ) { }

  ngOnInit() {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadGoogleSDK();
  }

  loginWithEmail() {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Welcome! Signed in successfully.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        let errorMessage = 'Authentication failed. Please try again.';
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

  private loadGoogleSDK() {
    // Check if script already loaded
    if (typeof google !== 'undefined' && google.accounts) {
      this.initGoogleSignIn();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Guard against race condition — wait for google.accounts to be defined
      if (typeof google !== 'undefined' && google.accounts) {
        this.initGoogleSignIn();
      } else {
        // Retry after a short delay
        setTimeout(() => {
          if (typeof google !== 'undefined' && google.accounts) {
            this.initGoogleSignIn();
          } else {
            this.error = 'Failed to load Google Sign-In. Please refresh.';
          }
        }, 1000);
      }
    };
    script.onerror = () => {
      this.error = 'Failed to load Google Sign-In SDK. Check your network.';
    };
    document.head.appendChild(script);
  }

  private initGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => {
        // NgZone.run ensures change detection runs after Google callback
        this.ngZone.run(() => this.handleCredentialResponse(response));
      },
    });
    google.accounts.id.renderButton(
      document.getElementById('googleSignInButton'),
      { theme: 'outline', size: 'large', width: 320, text: 'signin_with', shape: 'pill' }
    );
  }

  private handleCredentialResponse(response: any) {
    this.loading = true;
    this.error = '';
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Welcome! Signed in successfully.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        let errorMessage = 'Authentication failed. Please try again.';
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
