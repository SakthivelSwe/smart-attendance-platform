import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats } from '../../core/models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="mb-8">
        <h1 class="page-header">Dashboard</h1>
        <p class="page-subtitle">Overview of today's attendance and key metrics</p>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <!-- Total Employees -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">Total</span>
          </div>
          <p class="text-3xl font-bold text-[var(--text-primary)]">{{ stats?.totalEmployees || 0 }}</p>
          <p class="text-sm text-[var(--text-secondary)] mt-1">Employees</p>
        </div>

        <!-- Present Today -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
              {{ stats?.totalEmployees ? ((stats!.presentToday / stats!.totalEmployees) * 100).toFixed(0) : 0 }}%
            </span>
          </div>
          <p class="text-3xl font-bold text-[var(--text-primary)]">{{ stats?.presentToday || 0 }}</p>
          <p class="text-sm text-[var(--text-secondary)] mt-1">Present Today</p>
          <div class="flex gap-3 mt-3">
            <span class="badge-wfo text-xs">WFO: {{ stats?.wfoToday || 0 }}</span>
            <span class="badge-wfh text-xs">WFH: {{ stats?.wfhToday || 0 }}</span>
          </div>
        </div>

        <!-- On Leave -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span *ngIf="stats?.pendingLeaves" class="badge-pending text-xs">{{ stats?.pendingLeaves }} pending</span>
          </div>
          <p class="text-3xl font-bold text-[var(--text-primary)]">{{ stats?.onLeaveToday || 0 }}</p>
          <p class="text-sm text-[var(--text-secondary)] mt-1">On Leave Today</p>
        </div>

        <!-- Absent -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <p class="text-3xl font-bold text-[var(--text-primary)]">{{ stats?.absentToday || 0 }}</p>
          <p class="text-sm text-[var(--text-secondary)] mt-1">Absent Today</p>
          <div class="flex gap-3 mt-3" *ngIf="stats?.upcomingHolidays">
            <span class="badge-holiday text-xs">{{ stats?.upcomingHolidays }} upcoming holidays</span>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Attendance overview -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Today's Breakdown</h3>
          <div class="space-y-4">
            <div *ngFor="let bar of attendanceBars" class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-[var(--text-secondary)]">{{ bar.label }}</span>
                <span class="font-medium text-[var(--text-primary)]">{{ bar.value }}</span>
              </div>
              <div class="h-2.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000 ease-out"
                     [class]="bar.color"
                     [style.width.%]="bar.percent">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick stats -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Info</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span class="text-sm text-[var(--text-secondary)]">Last Processed</span>
              </div>
              <span class="text-sm font-medium text-[var(--text-primary)]">Today</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                </div>
                <span class="text-sm text-[var(--text-secondary)]">Pending Leaves</span>
              </div>
              <span class="text-sm font-semibold px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full">
                {{ stats?.pendingLeaves || 0 }}
              </span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                </div>
                <span class="text-sm text-[var(--text-secondary)]">Upcoming Holidays</span>
              </div>
              <span class="text-sm font-semibold px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full">
                {{ stats?.upcomingHolidays || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;

  get attendanceBars() {
    if (!this.stats || !this.stats.totalEmployees) return [];
    const total = this.stats.totalEmployees;
    return [
      { label: 'Work From Office', value: this.stats.wfoToday, percent: (this.stats.wfoToday / total) * 100, color: 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/20' },
      { label: 'Work From Home', value: this.stats.wfhToday, percent: (this.stats.wfhToday / total) * 100, color: 'bg-gradient-to-r from-blue-500 to-indigo-400 shadow-sm shadow-blue-500/20' },
      { label: 'On Leave', value: this.stats.onLeaveToday, percent: (this.stats.onLeaveToday / total) * 100, color: 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-sm shadow-amber-500/20' },
      { label: 'Absent', value: this.stats.absentToday, percent: (this.stats.absentToday / total) * 100, color: 'bg-gradient-to-r from-red-500 to-rose-400 shadow-sm shadow-red-500/20' },
    ];
  }

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getDashboardStats().subscribe({
      next: (data) => this.stats = data,
      error: () => this.stats = { totalEmployees: 0, presentToday: 0, wfoToday: 0, wfhToday: 0, onLeaveToday: 0, absentToday: 0, pendingLeaves: 0, upcomingHolidays: 0 }
    });
  }
}
