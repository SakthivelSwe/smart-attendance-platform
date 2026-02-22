import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
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

            <!-- Features List (Enterprise Minimalist) -->
            <div class="space-y-3 mb-8">
              <div class="flex items-center gap-4 py-2">
                <div class="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-[var(--text-primary)] font-semibold text-sm">WhatsApp Integration</h3>
                  <p class="text-[var(--text-secondary)] text-xs mt-0.5">Automated logging</p>
                </div>
              </div>
              
              <div class="flex items-center gap-4 py-2">
                <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                 <div>
                  <h3 class="text-[var(--text-primary)] font-semibold text-sm">Real-time Analytics</h3>
                  <p class="text-[var(--text-secondary)] text-xs mt-0.5">Live activity dashboard</p>
                </div>
              </div>
            </div>

            <!-- Google Sign In -->
            <div class="mt-8 flex justify-center">
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
            
            <div class="mt-10 text-center">
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
