import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  template: `<router-outlet></router-outlet><app-toast></app-toast>`
})
export class AppComponent implements OnInit {

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // On every app start, re-validate the stored JWT against the server.
    // If the user's role was changed by an admin since last login,
    // this ensures updated permissions take effect on the next page refresh.
    // A 401 response is handled by errorInterceptor → auto logout.
    if (this.authService.isLoggedIn) {
      this.authService.getCurrentUser().subscribe({
        next: (freshUser) => {
          const stored = this.authService.currentUser;
          if (stored && freshUser.role !== stored.role) {
            // Role changed server-side — update the stored session
            this.authService.updateStoredRole(freshUser.role);
          }
        },
        error: () => {
          // Handled by errorInterceptor (401 → logout, 403 → warning toast)
        }
      });
    }
  }
}
