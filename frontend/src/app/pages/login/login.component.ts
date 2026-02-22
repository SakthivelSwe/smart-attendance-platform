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
    <div class="min-h-screen flex items-center justify-center relative bg-[var(--bg-primary)] p-4">
      
      <!-- Minimalist Background Decoration (Enterprise) -->
      <div class="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.8),rgba(0,0,0,0.2))] bg-[bottom_1px_center] z-0"></div>

      <!-- Main Content Container -->
      <div class="relative z-10 w-full max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
        
        <!-- Left Side: Hero Text -->
        <div class="hidden md:block flex-1 space-y-8 animate-slide-in-right z-10">
          <h1 class="text-5xl lg:text-6xl font-sans font-bold tracking-tight text-[var(--text-primary)]">
            Attendance <br>
            <span class="text-primary-600 dark:text-primary-400">Automation</span>
          </h1>
          <p class="text-lg text-[var(--text-secondary)] max-w-md leading-relaxed font-sans">
            Empower your workforce with AI-driven tracking. Effortless, accurate, and integrated directly with your workflow.
          </p>
          <div class="flex items-center gap-4 pt-4">
             <div class="flex -space-x-3">
               <div class="w-10 h-10 rounded-full border border-surface-200 dark:border-surface-700 bg-[var(--card-bg)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-sm">AI</div>
               <div class="w-10 h-10 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-sm">HR</div>
               <div class="w-10 h-10 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-sm">IT</div>
             </div>
             <div class="text-sm font-medium text-[var(--text-secondary)]">Trusted by modern teams</div>
          </div>
        </div>

        <!-- Right Side: Login Card -->
        <div class="w-full max-w-md animate-slide-up z-10" style="animation-delay: 0.1s">
          <div class="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-8 lg:p-10 shadow-lg relative overflow-hidden">
            
            <!-- Logo Area -->
            <div class="text-center mb-8">
              <div class="w-16 h-16 mx-auto rounded-xl bg-primary-600 flex items-center justify-center mb-6 shadow-sm border border-primary-700">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 class="text-2xl font-sans font-bold text-[var(--text-primary)] tracking-tight">Welcome Back</h2>
              <p class="text-[var(--text-secondary)] mt-1.5 text-sm">Sign in to your workspace</p>
            </div>

            <!-- Email/Password Login Form -->
            <form (ngSubmit)="loginWithEmail()" #loginForm="ngForm" class="space-y-4 mb-6">
              <div>
                <label for="email" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
                <input type="email" id="email" name="email" [(ngModel)]="email" required
                       class="w-full px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[var(--text-primary)]">
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label for="password" class="block text-sm font-medium text-[var(--text-secondary)]">Password</label>
                  <a routerLink="/forgot-password" class="text-xs text-primary-600 dark:text-primary-400 hover:underline">Forgot password?</a>
                </div>
                <input type="password" id="password" name="password" [(ngModel)]="password" required
                       class="w-full px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-[var(--text-primary)]">
              </div>
              <button type="submit" [disabled]="!loginForm.form.valid || loading"
                      class="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                Sign In
              </button>
            </form>

            <div class="relative flex py-2 items-center mb-6">
              <div class="flex-grow border-t border-[var(--border-color)]"></div>
              <span class="flex-shrink-0 mx-4 text-[var(--text-secondary)] text-sm">Or continue with</span>
              <div class="flex-grow border-t border-[var(--border-color)]"></div>
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
                <span class="text-sm font-medium">Authenticating...</span>
              </div>
            </div>

            <div *ngIf="error" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-3 animate-fade-in">
              <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-red-700 dark:text-red-400 text-sm">{{ error }}</p>
            </div>
            
            <div class="mt-8 text-center text-sm">
              <span class="text-[var(--text-secondary)]">Don't have an account? </span>
              <a routerLink="/register" class="text-primary-600 dark:text-primary-400 font-medium hover:underline">Register here</a>
            </div>

            <div class="mt-8 text-center">
              <p class="text-xs text-[var(--text-secondary)] uppercase tracking-widest">
                <a href="#" class="hover:text-[var(--text-primary)] transition-colors">Terms</a> · <a href="#" class="hover:text-[var(--text-primary)] transition-colors">Privacy</a>
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
        this.error = err.error?.message || 'Authentication failed. Please try again.';
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
        this.error = err.error?.message || 'Authentication failed. Please try again.';
      }
    });
  }
}
