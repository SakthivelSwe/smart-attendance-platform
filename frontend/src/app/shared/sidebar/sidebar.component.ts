import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Desktop sidebar -->
    <aside class="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] z-40 transition-all duration-300"
           [class.w-64]="!isCollapsed" [class.w-20]="isCollapsed">

      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-[var(--border-color)]">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
        </div>
        <div *ngIf="!isCollapsed" class="min-w-0">
          <h1 class="text-lg font-bold text-[var(--text-primary)] truncate">SmartAttend</h1>
          <p class="text-xs text-[var(--text-secondary)]">Automation Platform</p>
        </div>
      </div>

      <!-- Collapse toggle -->
      <button (click)="toggleCollapse.emit()"
              class="absolute -right-3 top-20 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors">
        <svg class="w-3 h-3 transition-transform" [class.rotate-180]="isCollapsed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <a *ngFor="let item of navItems"
           [routerLink]="item.route"
           routerLinkActive="active"
           class="sidebar-link"
           [title]="item.label">
          <span [innerHTML]="item.icon" class="w-5 h-5 flex-shrink-0"></span>
          <span *ngIf="!isCollapsed" class="truncate">{{ item.label }}</span>
        </a>
      </nav>

      <!-- User info -->
      <div class="px-3 py-4 border-t border-[var(--border-color)]">
        <div class="flex items-center gap-3 px-3 py-2" *ngIf="authService.currentUser as user">
          <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name + '&background=6366f1&color=fff'"
               class="w-9 h-9 rounded-full ring-2 ring-primary-500/20 flex-shrink-0" [alt]="user.name"/>
          <div *ngIf="!isCollapsed" class="min-w-0">
            <p class="text-sm font-semibold text-[var(--text-primary)] truncate">{{ user.name }}</p>
            <p class="text-xs text-[var(--text-secondary)] truncate">{{ user.role }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile sidebar -->
    <aside *ngIf="isMobileOpen"
           class="lg:hidden fixed left-0 top-0 h-screen w-72 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] z-50 animate-slide-in-right">
      <div class="flex items-center justify-between px-6 py-5 border-b border-[var(--border-color)]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <h1 class="text-lg font-bold text-[var(--text-primary)]">SmartAttend</h1>
        </div>
        <button (click)="closeMobile.emit()" class="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <nav class="px-3 py-4 space-y-1">
        <a *ngFor="let item of navItems"
           [routerLink]="item.route"
           routerLinkActive="active"
           (click)="closeMobile.emit()"
           class="sidebar-link">
          <span [innerHTML]="item.icon" class="w-5 h-5 flex-shrink-0"></span>
          <span>{{ item.label }}</span>
        </a>
      </nav>
    </aside>
  `
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Input() isMobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();

  constructor(public authService: AuthService) { }

  navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>' },
    { label: 'Attendance', route: '/attendance', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>' },
    { label: 'Employees', route: '/employees', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' },
    { label: 'Leaves', route: '/leaves', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' },
    { label: 'Holidays', route: '/holidays', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>' },
    { label: 'Summary', route: '/summary', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>' },
    { label: 'Groups', route: '/groups', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>' },
    { label: 'Settings', route: '/settings', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' },
  ];
}
