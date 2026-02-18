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
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
      <!-- Background Image with Overlay -->
      <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920" 
             alt="Background" 
             class="w-full h-full object-cover animate-fade-in"
             style="animation-duration: 1.5s">
        <div class="absolute inset-0 bg-gradient-to-br from-primary-950/90 via-surface-900/80 to-primary-900/90 backdrop-blur-sm"></div>
      </div>

      <!-- Animated Particles/Orbs (Pure CSS) -->
      <div class="absolute top-20 left-20 w-72 h-72 bg-primary-500/30 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div class="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-[120px] animate-pulse-slow" style="animation-delay: 2s"></div>

      <!-- Main Content Container -->
      <div class="relative z-10 w-full max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
        
        <!-- Left Side: Hero Text (Hidden on Mobile) -->
        <div class="hidden md:block flex-1 text-white space-y-6 animate-slide-in-right">
          <h1 class="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Seamless <br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Attendance</span>
            <br> Automation
          </h1>
          <p class="text-lg text-white/80 max-w-md leading-relaxed">
            Empower your workforce with AI-driven tracking. Effortless, accurate, and integrated directly with your workflow.
          </p>
          <div class="flex items-center gap-4 pt-4">
             <div class="flex -space-x-3">
               <div class="w-10 h-10 rounded-full border-2 border-primary-900 bg-surface-800 flex items-center justify-center text-xs font-bold">AI</div>
               <div class="w-10 h-10 rounded-full border-2 border-primary-900 bg-surface-700 flex items-center justify-center text-xs font-bold">HR</div>
               <div class="w-10 h-10 rounded-full border-2 border-primary-900 bg-surface-600 flex items-center justify-center text-xs font-bold">IT</div>
             </div>
             <div class="text-sm font-medium text-white/90">Trusted by modern teams</div>
          </div>
        </div>

        <!-- Right Side: Login Card -->
        <div class="w-full max-w-md animate-slide-up" style="animation-delay: 0.2s">
          <div class="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl relative overflow-hidden group hover:border-white/30 transition-all duration-500">
            <!-- Shine Effect -->
            <div class="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>

            <!-- Logo Area -->
            <div class="text-center mb-8 relative">
              <div class="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/40 transform group-hover:scale-105 transition-transform duration-300">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 class="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
              <p class="text-white/60 text-sm mt-1">Sign in to access your dashboard</p>
            </div>

            <!-- Features List (Compact) -->
            <div class="space-y-4 mb-8">
              <div class="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-white font-medium text-sm">WhatsApp Integration</h3>
                  <p class="text-white/50 text-xs">Log attendance via chat</p>
                </div>
              </div>
              
              <div class="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                 <div>
                  <h3 class="text-white font-medium text-sm">Real-time Analytics</h3>
                  <p class="text-white/50 text-xs">Live dashboard updates</p>
                </div>
              </div>
            </div>

            <!-- Google Sign In -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-white/10"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-transparent text-white/50 bg-[#1e1b4b]">Continue with</span>
              </div>
            </div>

            <div class="mt-6 flex justify-center">
               <div id="googleSignInButton" class="w-full flex justify-center transform hover:scale-[1.02] transition-transform duration-200"></div>
            </div>

            <div *ngIf="loading" class="flex justify-center mt-6">
              <div class="flex items-center gap-3 text-primary-300">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span class="text-sm font-medium">Authenticating...</span>
              </div>
            </div>

            <div *ngIf="error" class="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-red-200 text-sm">{{ error }}</p>
            </div>
            
            <div class="mt-8 text-center">
              <p class="text-xs text-white/30">
                By signing in, you agree to our <a href="#" class="text-primary-400 hover:text-primary-300 underline">Terms</a> and <a href="#" class="text-primary-400 hover:text-primary-300 underline">Privacy Policy</a>
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
