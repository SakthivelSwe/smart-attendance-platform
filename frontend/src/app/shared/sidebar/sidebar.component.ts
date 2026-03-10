import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UserRole } from '../../core/models/interfaces';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  minRole?: UserRole;   // Minimum role required (uses hierarchy)
  exactRole?: UserRole; // Only this exact role can see it
  badge?: string;       // Optional badge text
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Desktop sidebar -->
    <aside class="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] z-40 transition-all duration-300"
           [class.w-72]="!isCollapsed" [class.w-20]="isCollapsed">

      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-6 border-b border-[var(--border-color)]">
        <div class="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-primary-700">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div *ngIf="!isCollapsed" class="min-w-0 animate-fade-in">
          <h1 class="text-xl font-sans font-bold text-[var(--text-primary)] tracking-tight truncate">SmartAttend</h1>
          <p class="text-xs text-[var(--text-secondary)] font-medium tracking-wide">Automation Platform</p>
        </div>
      </div>

      <!-- Collapse toggle -->
      <button (click)="toggleCollapse.emit()"
              class="absolute -right-3 top-24 w-6 h-6 bg-white dark:bg-surface-800 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-full flex items-center justify-center shadow-lg hover:text-primary-600 transition-all hover:scale-110 z-50">
        <svg class="w-3 h-3 transition-transform duration-300" [class.rotate-180]="isCollapsed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <ng-container *ngFor="let section of navSections">
          <!-- Section Label -->
          <div *ngIf="section.label && !isCollapsed && hasVisibleItems(section.items)" 
               class="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">
            {{ section.label }}
          </div>
          <div *ngIf="section.label && isCollapsed && hasVisibleItems(section.items)" 
               class="border-t border-[var(--border-color)] my-2 mx-2"></div>

          <ng-container *ngFor="let item of section.items">
            <a *ngIf="isItemVisible(item)"
               [routerLink]="item.route"
               routerLinkActive="active"
               class="sidebar-link group"
               [title]="item.label">
              <span [innerHTML]="getIcon(item.icon)" class="w-6 h-6 flex-shrink-0"></span>
              <span *ngIf="!isCollapsed" class="truncate font-medium animate-fade-in">{{ item.label }}</span>
              
              <!-- Badge -->
              <span *ngIf="item.badge && !isCollapsed" 
                    class="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {{ item.badge }}
              </span>
              
              <!-- Active Indicator Dot -->
              <div class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-[.active]:opacity-100 transition-opacity" *ngIf="!isCollapsed && !item.badge"></div>
            </a>
          </ng-container>
        </ng-container>
      </nav>

      <!-- User info -->
      <div class="px-4 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
        <a routerLink="/profile" class="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-white dark:hover:bg-surface-800 cursor-pointer" *ngIf="authService.currentUser as user">
          <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name + '&background=6366f1&color=fff'"
               class="w-10 h-10 rounded-full ring-2 ring-white dark:ring-surface-700 shadow-md flex-shrink-0" [alt]="user.name"/>
          <div *ngIf="!isCollapsed" class="min-w-0 animate-fade-in">
            <p class="text-sm font-semibold text-[var(--text-primary)] truncate">{{ user.name }}</p>
            <span class="inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                  [ngClass]="getRolePillClass(user.role)">
              {{ formatRole(user.role) }}
            </span>
          </div>
        </a>
      </div>
    </aside>

    <!-- Mobile sidebar -->
    <aside *ngIf="isMobileOpen"
           class="lg:hidden fixed left-0 top-0 h-screen w-72 sm:w-80 max-w-[85vw] bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] z-50 animate-slide-in-right shadow-2xl">
      <div class="flex items-center justify-between px-6 py-6 border-b border-[var(--border-color)]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm border border-primary-700">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 class="text-xl font-sans font-bold tracking-tight text-[var(--text-primary)]">SmartAttend</h1>
        </div>
        <button (click)="closeMobile.emit()" class="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition text-[var(text-secondary)]">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <nav class="px-4 py-6 space-y-1 overflow-y-auto">
        <ng-container *ngFor="let section of navSections">
          <div *ngIf="section.label && hasVisibleItems(section.items)" 
               class="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">
            {{ section.label }}
          </div>
          <ng-container *ngFor="let item of section.items">
            <a *ngIf="isItemVisible(item)"
               [routerLink]="item.route"
               routerLinkActive="active"
               (click)="closeMobile.emit()"
               class="sidebar-link group">
              <span [innerHTML]="getIcon(item.icon)" class="w-6 h-6 flex-shrink-0"></span>
              <span class="font-medium">{{ item.label }}</span>
              <span *ngIf="item.badge" 
                    class="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {{ item.badge }}
              </span>
            </a>
          </ng-container>
        </ng-container>
      </nav>
    </aside>
  `
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Input() isMobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();

  constructor(public authService: AuthService, private sanitizer: DomSanitizer) { }

  getIcon(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  /**
   * Check if a nav item should be visible based on the user's role.
   */
  isItemVisible(item: NavItem): boolean {
    if (item.exactRole) {
      return this.authService.hasRole(item.exactRole);
    }
    if (item.minRole) {
      return this.authService.hasMinRole(item.minRole);
    }
    return true; // No role restriction — visible to all
  }

  hasVisibleItems(items: NavItem[]): boolean {
    return items.some(item => this.isItemVisible(item));
  }

  formatRole(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'MANAGER': return 'Manager';
      case 'TEAM_LEAD': return 'Team Lead';
      case 'USER': return 'Employee';
      default: return role;
    }
  }

  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'ADMIN': return 'bg-red-500';
      case 'MANAGER': return 'bg-amber-500';
      case 'TEAM_LEAD': return 'bg-blue-500';
      default: return 'bg-emerald-500';
    }
  }

  getRolePillClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'MANAGER': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'TEAM_LEAD': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    }
  }

  // Icons
  private icons = {
    dashboard: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>',
    attendance: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    employees: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
    leaves: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
    holidays: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>',
    summary: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
    groups: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
    settings: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
    teams: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
    users: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    reports: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
    import: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>',
  };

  navSections: { label?: string; items: NavItem[] }[] = [
    {
      items: [
        { label: 'Dashboard', route: '/dashboard', icon: this.icons.dashboard },
      ]
    },
    {
      label: 'Management',
      items: [
        // All 4 roles can access these pages
        { label: 'Attendance', route: '/attendance', icon: this.icons.attendance },
        { label: 'Employees', route: '/employees', icon: this.icons.employees },
        { label: 'Leaves', route: '/leaves', icon: this.icons.leaves },
        { label: 'Holidays', route: '/holidays', icon: this.icons.holidays },
      ]
    },
    {
      label: 'Organization',
      items: [
        // TEAM_LEAD and above
        { label: 'Teams', route: '/teams', icon: this.icons.teams, minRole: 'TEAM_LEAD' },
        { label: 'Groups', route: '/groups', icon: this.icons.groups, minRole: 'TEAM_LEAD' },
        // ADMIN only
        { label: 'Users', route: '/user-management', icon: this.icons.users, minRole: 'ADMIN' },
      ]
    },
    {
      label: 'Analytics',
      items: [
        // TEAM_LEAD and above
        { label: 'Summary', route: '/summary', icon: this.icons.summary, minRole: 'TEAM_LEAD' },
        { label: 'Reports', route: '/reports', icon: this.icons.reports, minRole: 'TEAM_LEAD', badge: 'PRO' },
        { label: 'Report Cards', route: '/employee-report-card', icon: this.icons.reports, minRole: 'TEAM_LEAD' },
      ]
    },
    {
      label: 'Personal',
      items: [
        // All 4 roles can access notification settings
        { label: 'Notifications', route: '/notification-settings', icon: this.icons.settings },
      ]
    },
    {
      label: 'System',
      items: [
        // ADMIN only
        { label: 'Settings', route: '/settings', icon: this.icons.settings, minRole: 'ADMIN' },
        { label: 'Audit Logs', route: '/audit-logs', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg>', minRole: 'ADMIN' },
      ]
    },
  ];
}
