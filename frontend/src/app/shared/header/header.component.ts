import { Component, OnInit, OnDestroy, HostListener, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/40 animate-fade-in transition-all duration-500">
      <div class="flex items-center justify-between px-6 lg:px-10 h-20">
        <!-- Left Section -->
        <div class="flex items-center gap-6">
          <button (click)="toggleMobileMenu.emit()" 
                  class="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-primary-500 hover:text-white transition-all transform active:scale-95">
            <span class="material-icons">menu_open</span>
          </button>

          <div class="hidden md:flex items-center gap-3 bg-slate-100/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl px-5 py-3 w-80 lg:w-96 group focus-within:ring-2 focus-within:ring-primary-500/10 focus-within:border-primary-500/30 transition-all duration-300">
            <span class="material-icons text-slate-400 group-focus-within:text-primary-500 transition-colors">search</span>
            <input type="text" placeholder="Omni Search: employees, attendance..."
              class="bg-transparent border-none outline-none text-[13px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 w-full tracking-tight"/>
            <span class="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Enter</span>
          </div>
        </div>

        <!-- Right Section: Interactive Actions -->
        <div class="flex items-center gap-3">
          <!-- Quick Status (Optional Addition) -->
          <div class="hidden xl:flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">System Live</span>
          </div>

          <!-- Theme Configuration Accelerator -->
          <button (click)="themeService.toggleTheme()"
                  class="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all hover:scale-110 active:scale-90 shadow-sm overflow-hidden"
                  [title]="themeService.isDark ? 'Lumina Mode' : 'Shadow Mode'">
            <div class="relative w-full h-full flex items-center justify-center transform transition-transform duration-500" [class.rotate-[360deg]="themeService.isDark">
              <span *ngIf="!themeService.isDark" class="material-icons text-amber-500">light_mode</span>
              <span *ngIf="themeService.isDark" class="material-icons text-indigo-400">dark_mode</span>
            </div>
          </button>

          <!-- Notification Command Center -->
          <div class="relative" id="notifications-container">
            <button (click)="toggleNotifications()"
                    class="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all hover:scale-110 active:scale-90 relative"
                    title="Intelligence Center">
              <span class="material-icons-outlined text-slate-600 dark:text-slate-300">notifications</span>
              <span *ngIf="notifications.length > 0"
                    class="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 px-1 shadow-lg shadow-red-500/20 animate-bounce">
                {{ notifications.length }}
              </span>
            </button>

            <!-- Refined Intelligence Dropdown -->
            <div *ngIf="showNotifications"
                 class="absolute -right-2 sm:right-0 top-full mt-5 w-[90vw] sm:w-[420px] glass-card shadow-3xl rounded-[2.5rem] border-0 ring-1 ring-slate-200/50 dark:ring-white/10 overflow-hidden z-50 animate-scale-in">

              <div class="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <div>
                  <h3 class="text-xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none">Notifications</h3>
                  <p class="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Real-time Activity Stream</p>
                </div>
                <button (click)="refresh()" 
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary-500 hover:text-white transition-all transform active:rotate-180">
                  <span class="material-icons text-sm" [class.animate-spin]="isLoading">refresh</span>
                </button>
              </div>

              <div class="max-h-[500px] overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-100 dark:scrollbar-thumb-slate-800">
                <div *ngIf="isLoading && notifications.length === 0" class="space-y-6 px-4">
                  <div *ngFor="let i of [1,2]" class="flex gap-4 animate-pulse">
                    <div class="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0"></div>
                    <div class="flex-1 space-y-3">
                      <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
                      <div class="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-full"></div>
                    </div>
                  </div>
                </div>

                <div *ngFor="let note of notifications; trackBy: trackByNotificationId"
                     class="group p-5 hover:bg-white dark:hover:bg-slate-800/60 rounded-[1.8rem] border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 hover:shadow-xl transition-all duration-300">
                  <div class="flex gap-4">
                    <div [class]="getIconBg(note.color) + ' w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/10 transform group-hover:rotate-6 transition-transform opacity-90'">
                      <span class="material-icons text-white text-lg">{{ note.icon }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2 mb-1">
                        <p class="text-sm font-black text-slate-900 dark:text-white font-manrope leading-tight group-hover:text-primary-600 transition-colors">{{ note.title }}</p>
                        <span *ngIf="note.count > 1"
                              [class]="getCountBadge(note.color)"
                              class="text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0">
                          +{{ note.count }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">{{ note.content }}</p>
                      <div class="flex items-center gap-2">
                        <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" [class]="getTimeColor(note.color) + ' bg-slate-50 dark:bg-slate-900/50'">
                          {{ note.timeLabel }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div *ngIf="!isLoading && notifications.length === 0"
                     class="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-700">
                  <div class="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6">
                    <span class="material-icons text-5xl">notifications_none</span>
                  </div>
                  <h4 class="text-lg font-black text-slate-900 dark:text-white font-manrope tracking-tight">Zero Delta</h4>
                  <p class="text-xs font-bold uppercase tracking-widest mt-2">Intelligence Stream is Empty</p>
                </div>
              </div>

              <div class="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-center">
                <button (click)="showNotifications = false"
                        class="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all">
                  Dismiss Protocol
                </button>
              </div>
            </div>
          </div>

          <!-- Operator Interface -->
          <div class="relative user-menu-container" *ngIf="authService.currentUser as user">
            <button (click)="showUserMenu = !showUserMenu; showNotifications = false"
                    class="group flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 transform active:scale-95 shadow-sm">
              <div class="relative items-center justify-center flex">
                <img #profileImg [src]="user.avatarUrl || getDefaultAvatar(user.name)"
                     (error)="handleImageError($event, user.name)"
                     class="w-10 h-10 rounded-xl ring-2 ring-primary-500/10 object-cover shadow-sm group-hover:scale-105 transition-transform" [alt]="user.name"/>
                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-lg flex items-center justify-center">
                  <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div class="hidden md:flex flex-col items-start min-w-[100px]">
                <span class="text-xs font-black text-slate-900 dark:text-white font-manrope truncate w-full group-hover:text-primary-600 transition-colors uppercase tracking-tight">{{ user.name }}</span>
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">{{ user.role }}</span>
              </div>
              <span class="material-icons text-slate-400 text-sm hidden md:block group-hover:translate-y-0.5 transition-transform" [class.rotate-180]="showUserMenu">expand_more</span>
            </button>

            <!-- Sophisticated Identity Menu -->
            <div *ngIf="showUserMenu"
                 class="absolute right-0 top-full mt-4 w-72 glass-card shadow-3xl rounded-[2rem] border-0 ring-1 ring-slate-200/50 dark:ring-white/10 p-6 animate-scale-in z-50">
              <div class="flex flex-col items-center text-center p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 mb-6">
                 <div class="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-xl shadow-primary-500/20">
                    <span class="text-2xl font-black font-manrope">{{ user.name.charAt(0) }}</span>
                 </div>
                 <p class="text-lg font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none">{{ user.name }}</p>
                 <p class="text-[10px] text-slate-400 font-bold mt-2 truncate w-full px-2">{{ user.email }}</p>
              </div>

              <div class="space-y-1">
                <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                  <span class="material-icons text-lg text-slate-400 group-hover:text-primary-500 transition-colors">account_circle</span>
                  <span class="text-xs font-bold font-manrope group-hover:text-slate-900 dark:group-hover:text-white">Profile Control</span>
                </button>
                <div class="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2"></div>
                <button (click)="authService.logout(); showUserMenu = false"
                        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group">
                  <span class="material-icons text-lg group-hover:translate-x-1 transition-transform">logout</span>
                  <span class="text-xs font-black uppercase tracking-widest">Sign Out</span>
                </button>
              </div>
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
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Load immediately, then every 5 minutes
    this.pollSub = interval(5 * 60 * 1000)
      .pipe(startWith(0), switchMap(() => {
        this.isLoading = true;
        return this.api.getNotifications();
      }))
      .subscribe({
        next: (data) => { this.notifications = data; this.isLoading = false; this.cdr.markForCheck(); },
        error: () => { this.isLoading = false; this.cdr.markForCheck(); }
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
    this.cdr.markForCheck();
    this.api.getNotifications().subscribe({
      next: (data) => { this.notifications = data; this.isLoading = false; this.cdr.markForCheck(); },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    let changed = false;
    if (!target.closest('#notifications-container') && this.showNotifications) {
      this.showNotifications = false;
      changed = true;
    }
    if (!target.closest('.user-menu-container') && this.showUserMenu) {
      if (!target.closest('button[click="showUserMenu = !showUserMenu"]') && !target.closest('button.flex.items-center.gap-2.pl-2.pr-3.py-1\\.5')) {
          this.showUserMenu = false;
          changed = true;
      }
    }
    if (changed) {
        this.cdr.markForCheck();
    }
  }

  getIconBg(color: string): string {
    const map: Record<string, string> = {
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
      indigo: 'bg-indigo-500',
      emerald: 'bg-emerald-500',
    };
    return map[color] ?? 'bg-primary-500';
  }

  getCountBadge(color: string): string {
    const map: Record<string, string> = {
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return map[color] ?? 'bg-primary-100 text-primary-700';
  }

  getTimeColor(color: string): string {
    const map: Record<string, string> = {
      amber: 'text-amber-500',
      rose: 'text-rose-500',
      indigo: 'text-indigo-500',
      emerald: 'text-emerald-500',
    };
    return map[color] ?? 'text-primary-500';
  }

  handleImageError(event: any, name: string) {
    event.target.src = this.getDefaultAvatar(name);
  }

  getDefaultAvatar(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`;
  }
  
  trackByNotificationId(index: number, item: any): string {
    return item.id || index.toString();
  }
}
