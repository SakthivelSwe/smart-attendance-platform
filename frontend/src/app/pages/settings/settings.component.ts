import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div>
      <div class="mb-6">
        <h1 class="page-header">Settings</h1>
        <p class="page-subtitle">Configure your preferences and account settings</p>
      </div>

      <div class="space-y-6 max-w-2xl">
        <!-- Appearance -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Appearance</h3>
          <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)]">
            <div>
              <p class="font-medium text-[var(--text-primary)]">Dark Mode</p>
              <p class="text-sm text-[var(--text-secondary)]">Toggle between light and dark themes</p>
            </div>
            <button (click)="themeService.toggleTheme()"
                    class="relative w-14 h-7 rounded-full transition-colors duration-300"
                    [class.bg-primary-600]="themeService.isDark"
                    [class.bg-surface-300]="!themeService.isDark">
              <span class="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300"
                    [class.translate-x-7]="themeService.isDark"></span>
            </button>
          </div>
        </div>

        <!-- Account -->
        <div class="card p-6" *ngIf="authService.currentUser as user">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Account</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)]">
              <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name + '&background=6366f1&color=fff'"
                   class="w-14 h-14 rounded-xl ring-2 ring-primary-500/20" [alt]="user.name"/>
              <div>
                <p class="font-semibold text-[var(--text-primary)] text-lg">{{ user.name }}</p>
                <p class="text-sm text-[var(--text-secondary)]">{{ user.email }}</p>
                <span class="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class.bg-primary-100]="user.role === 'ADMIN'" [class.text-primary-700]="user.role === 'ADMIN'"
                      [class.bg-surface-100]="user.role !== 'ADMIN'" [class.text-surface-700]="user.role !== 'ADMIN'">
                  {{ user.role }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">About</h3>
          <div class="space-y-2 text-sm text-[var(--text-secondary)]">
            <p><span class="font-medium">Application:</span> Smart Attendance Automation Platform</p>
            <p><span class="font-medium">Version:</span> 1.0.0</p>
            <p><span class="font-medium">Frontend:</span> Angular 17 + TailwindCSS 3</p>
            <p><span class="font-medium">Backend:</span> Spring Boot 3.2 + PostgreSQL</p>
          </div>
        </div>

        <!-- Sign out -->
        <button (click)="authService.logout()" class="btn-danger w-full">Sign Out</button>
      </div>
    </div>
  `
})
export class SettingsComponent {
    constructor(public authService: AuthService, public themeService: ThemeService) { }
}
