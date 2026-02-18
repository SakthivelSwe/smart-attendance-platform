import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="sticky top-0 z-20 bg-[var(--card-bg)]/80 backdrop-blur-lg border-b border-[var(--border-color)]">
      <div class="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16">
        <!-- Left: Mobile menu + Search -->
        <div class="flex items-center gap-4">
          <button (click)="toggleMobileMenu.emit()" class="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <div class="hidden md:flex items-center gap-2 bg-[var(--bg-secondary)] rounded-xl px-4 py-2 w-64 lg:w-80">
            <svg class="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Search employees, attendance..." class="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] w-full"/>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <!-- Theme toggle -->
          <button (click)="themeService.toggleTheme()"
                  class="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                  [title]="themeService.isDark ? 'Switch to Light' : 'Switch to Dark'">
            <svg *ngIf="!themeService.isDark" class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <svg *ngIf="themeService.isDark" class="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>

          <!-- Notifications -->
          <button class="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 relative">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-red-500 to-rose-500 shadow-sm shadow-red-500/30 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>

          <!-- User menu -->
          <div class="relative" *ngIf="authService.currentUser as user">
            <button (click)="showUserMenu = !showUserMenu"
                    class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200">
              <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name + '&background=6366f1&color=fff'"
                   class="w-8 h-8 rounded-full ring-2 ring-primary-500/20" [alt]="user.name"/>
              <span class="hidden md:inline text-sm font-medium text-[var(--text-primary)]">{{ user.name }}</span>
              <svg class="w-4 h-4 text-[var(--text-secondary)] hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- Dropdown -->
            <div *ngIf="showUserMenu"
                 class="absolute right-0 top-full mt-2 w-56 bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] py-2 animate-slide-up z-50">
              <div class="px-4 py-3 border-b border-[var(--border-color)]">
                <p class="text-sm font-semibold text-[var(--text-primary)]">{{ user.name }}</p>
                <p class="text-xs text-[var(--text-secondary)]">{{ user.email }}</p>
              </div>
              <button (click)="authService.logout(); showUserMenu = false"
                      class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Output() toggleMobileMenu = new EventEmitter<void>();
  showUserMenu = false;

  constructor(public authService: AuthService, public themeService: ThemeService) { }
}
