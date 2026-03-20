import { Component, OnInit, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ApiService, AppNotification } from '../../core/services/api.service';
import { Subscription, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="sticky top-0 z-20 bg-[var(--card-bg)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div class="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16">
        <!-- Left: Mobile menu + Search -->
        <div class="flex items-center gap-3">
          <button (click)="toggleMobileMenu.emit()" class="lg:hidden p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200">
            <svg class="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <div class="hidden md:flex items-center gap-2.5 bg-[var(--bg-tertiary)] rounded-xl px-4 py-2.5 w-64 lg:w-80 border border-transparent focus-within:border-primary-500/30 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all duration-200">
            <svg class="w-4 h-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Search employees, attendance..."
              class="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-full font-body"/>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-1.5">
          <!-- Theme toggle -->
          <button (click)="themeService.toggleTheme()"
                  class="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 group"
                  [title]="themeService.isDark ? 'Switch to Light' : 'Switch to Dark'">
            <svg *ngIf="!themeService.isDark" class="w-5 h-5 text-amber-500 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <svg *ngIf="themeService.isDark" class="w-5 h-5 text-primary-400 group-hover:-rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>

          <!-- Notifications Bell -->
          <div class="relative" id="notifications-container">
            <button (click)="toggleNotifications()"
                    class="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 relative"
                    title="Notifications">
              <svg class="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <!-- Live badge -->
              <span *ngIf="notifications.length > 0"
                    class="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-gradient-to-r from-rose-500 to-rose-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--card-bg)] px-0.5">
                {{ notifications.length }}
              </span>
            </button>

            <!-- Notifications Dropdown -->
            <div *ngIf="showNotifications"
                 class="absolute -right-2 sm:right-0 top-full mt-2 w-[90vw] sm:w-96 max-w-[384px] bg-[var(--card-bg)] rounded-2xl shadow-elevated border border-[var(--border-color)] overflow-hidden z-50 animate-slide-down">

              <!-- Header -->
              <div class="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <h3 class="text-sm font-bold text-[var(--text-primary)] font-sans">Notifications</h3>
                <div class="flex items-center gap-2">
                  <span *ngIf="notifications.length > 0"
                        class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    {{ notifications.length }} New
                  </span>
                  <span *ngIf="isLoading"
                        class="text-[10px] text-[var(--text-tertiary)] animate-pulse">Refreshing...</span>
                  <button (click)="refresh()" title="Refresh notifications"
                          class="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition">
                    <span class="material-icons text-sm text-[var(--text-tertiary)]">refresh</span>
                  </button>
                </div>
              </div>

              <!-- Notification list -->
              <div class="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">

                <!-- Loading skeleton -->
                <div *ngIf="isLoading && notifications.length === 0" class="p-4 space-y-4">
                  <div *ngFor="let i of [1,2]" class="flex gap-3">
                    <div class="w-9 h-9 rounded-xl skeleton shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-3 skeleton rounded w-3/4"></div>
                      <div class="h-3 skeleton rounded w-full"></div>
                      <div class="h-2.5 skeleton rounded w-1/4"></div>
                    </div>
                  </div>
                </div>

                <!-- Real notifications -->
                <div *ngFor="let note of notifications"
                     class="p-4 hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors cursor-pointer">
                  <div class="flex gap-3">
                    <div [class]="getIconBg(note.color) + ' w-9 h-9 rounded-xl flex items-center justify-center shrink-0'">
                      <span class="material-icons text-white text-base">{{ note.icon }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2">
                        <p class="text-xs font-bold text-[var(--text-primary)] leading-snug font-sans">{{ note.title }}</p>
                        <span *ngIf="note.count > 1"
                              [class]="getCountBadge(note.color)"
                              class="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                          {{ note.count }}
                        </span>
                      </div>
                      <p class="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5 font-body">{{ note.content }}</p>
                      <p class="text-[10px] font-semibold mt-1.5 uppercase tracking-wider" [class]="getTimeColor(note.color)">
                        {{ note.timeLabel }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Empty state — no notifications -->
                <div *ngIf="!isLoading && notifications.length === 0"
                     class="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
                  <span class="material-icons text-3xl mb-3 opacity-30">notifications_off</span>
                  <p class="text-sm font-semibold font-sans">All caught up!</p>
                  <p class="text-xs opacity-60 mt-1">No pending items right now.</p>
                </div>
              </div>

              <!-- Footer -->
              <div class="px-4 py-3 bg-[var(--bg-tertiary)]/50 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span class="text-[10px] text-[var(--text-tertiary)] font-medium">Auto-refreshes every 5 min</span>
                <button (click)="showNotifications = false"
                        class="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline">
                  Close
                </button>
              </div>
            </div>
          </div>

          <!-- User menu -->
          <div class="relative" *ngIf="authService.currentUser as user">
            <button (click)="showUserMenu = !showUserMenu"
                    class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 ml-1">
              <div class="relative">
                <img #profileImg [src]="user.avatarUrl || getDefaultAvatar(user.name)"
                     (error)="handleImageError($event, user.name)"
                     class="w-8 h-8 rounded-xl ring-2 ring-primary-500/20 object-cover shadow-sm" [alt]="user.name"/>
                <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--card-bg)] rounded-full"></span>
              </div>
              <div class="hidden md:flex flex-col items-start">
                <span class="text-xs font-bold text-[var(--text-primary)] leading-tight font-sans">{{ user.name }}</span>
                <span class="text-[10px] font-medium text-[var(--text-tertiary)]">{{ user.role }}</span>
              </div>
              <svg class="w-3.5 h-3.5 text-[var(--text-tertiary)] hidden md:inline ml-0.5 transition-transform duration-200" [class.rotate-180]="showUserMenu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- User Dropdown -->
            <div *ngIf="showUserMenu"
                 class="absolute right-0 top-full mt-2 w-56 bg-[var(--card-bg)] rounded-2xl shadow-elevated border border-[var(--border-color)] py-2 animate-slide-down z-50">
              <div class="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p class="text-sm font-bold text-[var(--text-primary)] font-sans">{{ user.name }}</p>
                <p class="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{{ user.email }}</p>
              </div>
              <button (click)="authService.logout(); showUserMenu = false"
                      class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/10 transition mt-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
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
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleMobileMenu = new EventEmitter<void>();


  showUserMenu = false;
  showNotifications = false;
  notifications: AppNotification[] = [];
  isLoading = false;

  private pollSub?: Subscription;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private api: ApiService
  ) { }

  ngOnInit() {
    // Load immediately, then every 5 minutes
    this.pollSub = interval(5 * 60 * 1000)
      .pipe(startWith(0), switchMap(() => {
        this.isLoading = true;
        return this.api.getNotifications();
      }))
      .subscribe({
        next: (data) => { this.notifications = data; this.isLoading = false; },
        error: () => { this.isLoading = false; }
      });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  refresh() {
    this.isLoading = true;
    this.api.getNotifications().subscribe({
      next: (data) => { this.notifications = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('#notifications-container')) {
      this.showNotifications = false;
    }
    if (!target.closest('.user-menu-container')) {
      // only close user menu when clicking outside its container
    }
  }

  getIconBg(color: string): string {
    const map: Record<string, string> = {
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
      indigo: 'bg-primary-500',
      emerald: 'bg-emerald-500',
    };
    return map[color] ?? 'bg-primary-500';
  }

  getCountBadge(color: string): string {
    const map: Record<string, string> = {
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      indigo: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return map[color] ?? 'bg-primary-100 text-primary-700';
  }

  getTimeColor(color: string): string {
    const map: Record<string, string> = {
      amber: 'text-amber-500',
      rose: 'text-rose-500',
      indigo: 'text-primary-500',
      emerald: 'text-emerald-500',
    };
    return map[color] ?? 'text-primary-500';
  }

  handleImageError(event: any, name: string) {
    event.target.src = this.getDefaultAvatar(name);
  }

  getDefaultAvatar(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d43f1&color=fff&bold=true`;
  }
}
