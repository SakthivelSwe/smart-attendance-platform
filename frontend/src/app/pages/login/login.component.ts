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
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-900 via-primary-950 to-surface-900 relative overflow-hidden">
      <!-- Animated bg blobs -->
      <div class="absolute top-1/4 -left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
      <div class="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl animate-float" style="animation-delay: -3s"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow"></div>

      <!-- Login card -->
      <div class="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        <div class="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <!-- Logo -->
          <div class="text-center mb-8">
            <div class="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-6 shadow-lg shadow-primary-500/30">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-white mb-2">SmartAttend</h1>
            <p class="text-white/60">Automated Attendance Management</p>
          </div>

          <!-- Features -->
          <div class="space-y-3 mb-8">
            <div class="flex items-center gap-3 text-white/70 text-sm">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span>WhatsApp-based automatic attendance tracking</span>
            </div>
            <div class="flex items-center gap-3 text-white/70 text-sm">
              <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <span>Monthly reports with detailed analytics</span>
            </div>
            <div class="flex items-center gap-3 text-white/70 text-sm">
              <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <span>Email notifications &amp; leave management</span>
            </div>
          </div>

          <!-- Google Sign In -->
          <div id="googleSignInButton" class="flex justify-center"></div>

          <div *ngIf="loading" class="flex justify-center mt-4">
            <div class="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div *ngIf="error" class="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
            {{ error }}
          </div>
        </div>

        <p class="text-center text-white/30 text-xs mt-6">&copy; 2026 SmartAttend. Built with Angular &amp; Spring Boot.</p>
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
