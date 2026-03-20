import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, Team } from '../../core/models/interfaces';
import { NgApexchartsModule, ChartComponent, ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexTheme, ApexLegend, ApexStroke, ApexTooltip, ApexPlotOptions, ApexDataLabels } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  theme: ApexTheme;
  legend: ApexLegend;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  colors: string[];
  dataLabels: ApexDataLabels;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="page-header">{{ getGreeting() }}</h1>
          <p class="page-subtitle">{{ getDashboardSubtitle() }}</p>
        </div>

        <!-- Team selector for ADMIN / MANAGER / TEAM_LEAD -->
        <div *ngIf="teams.length > 0" class="flex items-center gap-3">
          <select [(ngModel)]="selectedTeamId" (ngModelChange)="onTeamChange($event)"
                  class="text-sm px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] focus:ring-2 focus:ring-primary-500/30 outline-none transition-all font-semibold min-w-[180px] font-sans">
            <option [ngValue]="null">All Teams (Org-wide)</option>
            <option *ngFor="let t of teams" [ngValue]="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>

      <!-- Quick Check-in Card -->
      <div class="mb-6 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg shadow-primary-600/20 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-60 h-60 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div class="absolute bottom-0 left-20 w-40 h-40 bg-white/[0.03] rounded-full translate-y-1/2"></div>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h3 class="text-lg font-extrabold mb-1 font-sans tracking-tight">Quick Check-in</h3>
            <p class="text-sm text-white/70 font-body" *ngIf="!checkedIn">Mark your attendance for today</p>
            <p class="text-sm text-emerald-200 flex items-center gap-1.5 font-semibold" *ngIf="checkedIn">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4"/></svg>
              Checked in as {{ checkInStatus }}
            </p>
          </div>
          <div class="flex gap-2" *ngIf="!checkedIn">
            <button (click)="doCheckIn('WFO')"
                    class="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold transition-all hover:scale-[1.03] backdrop-blur-sm border border-white/10 active:scale-[0.97]">
              🏢 WFO
            </button>
            <button (click)="doCheckIn('WFH')"
                    class="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold transition-all hover:scale-[1.03] backdrop-blur-sm border border-white/10 active:scale-[0.97]">
              🏠 WFH
            </button>
          </div>
        </div>
      </div>

      <!-- AI Insight Banner -->
      <div class="mb-8 relative overflow-hidden card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
         <div class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50">
            <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" [class.animate-pulse]="insightLoading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
         </div>
         <div class="flex-1">
            <h3 class="font-sans text-sm font-bold text-[var(--text-primary)] tracking-tight mb-1 flex items-center gap-2">
               Smart Insight
               <span class="px-2 py-0.5 rounded-md text-[9px] font-extrabold border bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200/60 text-primary-700 dark:from-primary-900/30 dark:to-primary-800/20 dark:border-primary-800/40 dark:text-primary-300">AI</span>
            </h3>
            <p *ngIf="insightLoading" class="text-[var(--text-secondary)] text-sm animate-pulse font-body">
               Analyzing today's attendance patterns...
            </p>
            <p *ngIf="!insightLoading && insight" class="text-[var(--text-primary)] text-sm leading-relaxed font-medium font-body">
               {{ insight }}
            </p>
            <p *ngIf="!insightLoading && !insight" class="text-[var(--text-secondary)] text-sm font-body">
               Insights unavailable.
            </p>
         </div>
         <button *ngIf="!insightLoading" (click)="loadInsight()" class="p-2.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-all" title="Refresh Insight">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
         </button>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        <!-- Total Employees -->
        <div class="stat-card animate-slide-up stagger-1">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-200/60 dark:border-primary-800/40">
              <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <span class="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-lg border border-primary-200/60 dark:border-primary-800/40 uppercase tracking-wider">Total</span>
          </div>
          <p class="stat-card-value">{{ stats?.totalEmployees || 0 }}</p>
          <p class="text-sm text-[var(--text-secondary)] mt-1 font-medium font-body">Employees Registered</p>
        </div>

        <!-- Present Today -->
        <div class="stat-card animate-slide-up stagger-2">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40">
              <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 tracking-wider">
              {{ presentPercentage }}% Rate
            </span>
          </div>
          <p class="stat-card-value">{{ stats?.presentToday || 0 }}</p>
          <p class="text-sm text-[var(--text-secondary)] mt-1 font-medium font-body">Present Today</p>
          <div class="flex gap-2 mt-3">
             <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">WFO: {{ stats?.wfoToday || 0 }}</span>
             </div>
             <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30">
                <div class="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                <span class="text-[10px] font-bold text-sky-700 dark:text-sky-400">WFH: {{ stats?.wfhToday || 0 }}</span>
             </div>
          </div>
        </div>

        <!-- On Leave -->
        <div class="stat-card animate-slide-up stagger-3">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/40">
              <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span *ngIf="stats?.pendingLeaves" class="animate-pulse text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40">{{ stats?.pendingLeaves }} Pending</span>
          </div>
          <p class="stat-card-value">{{ stats?.onLeaveToday || 0 }}</p>
          <p class="text-sm text-[var(--text-secondary)] mt-1 font-medium font-body">On Leave Today</p>
        </div>

        <!-- Absent -->
        <div class="stat-card animate-slide-up stagger-4">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/40">
              <svg class="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <p class="stat-card-value">{{ stats?.absentToday || 0 }}</p>
          <p class="text-sm text-[var(--text-secondary)] mt-1 font-medium font-body">Absent Today</p>
           <div class="flex gap-3 mt-3" *ngIf="stats?.upcomingHolidays">
            <span class="badge-holiday text-[10px]">{{ stats?.upcomingHolidays }} upcoming holidays</span>
          </div>
        </div>
      </div>

      <!-- Charts & Quick Info -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- Attendance overview (ApexChart) -->
        <div class="card p-6 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden">
          <h3 class="text-base font-bold text-[var(--text-primary)] mb-2 self-start font-sans">Today's Breakdown</h3>
          <div *ngIf="chartOptions" class="w-full flex justify-center animate-fade-in z-10" id="chart">
             <apx-chart
              [series]="chartOptions.series!"
              [chart]="chartOptions.chart!"
              [labels]="chartOptions.labels!"
              [colors]="chartOptions.colors!"
              [plotOptions]="chartOptions.plotOptions!"
              [dataLabels]="chartOptions.dataLabels!"
              [stroke]="chartOptions.stroke!"
              [legend]="chartOptions.legend!"
              [tooltip]="chartOptions.tooltip!"
            ></apx-chart>
          </div>
          <div *ngIf="!chartOptions" class="flex flex-col items-center justify-center h-48 opacity-50 z-10">
             <div class="flex gap-2">
                <div class="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce"></div>
                <div class="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
             </div>
             <span class="mt-4 text-sm font-medium text-[var(--text-secondary)] font-body">Loading Chart...</span>
          </div>
          <!-- Legend -->
          <div *ngIf="chartOptions" class="flex flex-wrap items-center justify-center gap-4 mt-3 animate-slide-up stagger-1 z-10">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span class="text-xs font-semibold text-[var(--text-secondary)]">WFO</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span class="text-xs font-semibold text-[var(--text-secondary)]">WFH</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span class="text-xs font-semibold text-[var(--text-secondary)]">On Leave</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span class="text-xs font-semibold text-[var(--text-secondary)]">Absent</span>
            </div>
          </div>
          <!-- Decorative -->
          <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-500/[0.03] rounded-full blur-3xl"></div>
          <div class="absolute top-10 -left-10 w-32 h-32 bg-accent-500/[0.03] rounded-full blur-3xl"></div>
        </div>

        <!-- Quick stats -->
        <div class="card p-6 relative overflow-hidden">
          <h3 class="text-base font-bold text-[var(--text-primary)] mb-5 relative z-10 font-sans">Quick Info</h3>
          <div class="space-y-3 relative z-10">
            <div class="group flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-transparent hover:border-primary-200/60 dark:hover:border-primary-800/40 transition-all cursor-default hover:shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 border border-primary-100 dark:border-primary-800/30">
                  <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors font-body">Last Processed</span>
              </div>
              <span class="text-sm font-bold text-[var(--text-primary)] font-sans">Today</span>
            </div>

            <div class="group flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-transparent hover:border-amber-200/60 dark:hover:border-amber-800/40 transition-all cursor-default hover:shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 border border-amber-100 dark:border-amber-800/30">
                  <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors font-body">Pending Leaves</span>
              </div>
              <span class="text-sm font-bold px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200/60 dark:border-amber-800/40 font-sans">
                {{ stats?.pendingLeaves || 0 }}
              </span>
            </div>

            <div class="group flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-transparent hover:border-violet-200/60 dark:hover:border-violet-800/40 transition-all cursor-default hover:shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 border border-violet-100 dark:border-violet-800/30">
                  <svg class="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors font-body">Upcoming Holidays</span>
              </div>
              <span class="text-sm font-bold px-3 py-1.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-lg border border-violet-200/60 dark:border-violet-800/40 font-sans">
                {{ stats?.upcomingHolidays || 0 }}
              </span>
            </div>
          </div>
          <div class="absolute -top-10 -right-10 w-40 h-40 bg-accent-500/[0.03] rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> | null = null;

  stats: DashboardStats | null = null;
  insight: string | null = null;
  insightLoading = false;

  get presentPercentage(): number {
    if (!this.stats || !this.stats.totalEmployees) return 0;
    return Math.round((this.stats.presentToday / this.stats.totalEmployees) * 100);
  }

  constructor(private api: ApiService, public authService: AuthService) { }

  teams: Team[] = [];
  selectedTeamId: number | null = null;
  checkedIn = false;
  checkInStatus = '';
  checkInLoading = false;

  ngOnInit() {
    this.loadStats();
    this.loadInsight();

    // Load teams for ADMIN/MANAGER/TEAM_LEAD
    if (this.authService.hasMinRole('TEAM_LEAD')) {
      this.api.getTeams().subscribe(t => this.teams = t);
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    const name = this.authService.currentUser?.name?.split(' ')[0] || '';
    if (hour < 12) return `Good Morning${name ? ', ' + name : ''} ☀️`;
    if (hour < 17) return `Good Afternoon${name ? ', ' + name : ''} 👋`;
    return `Good Evening${name ? ', ' + name : ''} 🌙`;
  }

  loadStats() {
    const obs = this.selectedTeamId
      ? this.api.getTeamDashboardStats(this.selectedTeamId)
      : this.api.getDashboardStats();

    obs.subscribe({
      next: (data) => {
        this.stats = data;
        this.initChart();
      },
      error: () => {
        this.stats = { totalEmployees: 0, presentToday: 0, wfoToday: 0, wfhToday: 0, onLeaveToday: 0, absentToday: 0, pendingLeaves: 0, upcomingHolidays: 0 };
        this.initChart();
      }
    });
  }

  onTeamChange(teamId: number | null) {
    this.selectedTeamId = teamId;
    this.loadStats();
  }

  getDashboardSubtitle(): string {
    if (this.selectedTeamId) {
      const team = this.teams.find(t => t.id === this.selectedTeamId);
      return team ? `Team: ${team.name} — Today's metrics` : 'Team metrics';
    }
    return 'Overview of today\'s attendance and key metrics';
  }

  doCheckIn(status: string) {
    this.checkInLoading = true;
    this.api.checkIn(status).subscribe({
      next: () => {
        this.checkedIn = true;
        this.checkInStatus = status;
        this.checkInLoading = false;
        this.loadStats(); // Refresh stats after check-in
      },
      error: () => this.checkInLoading = false
    });
  }

  loadInsight() {
    this.insightLoading = true;
    this.api.getDashboardInsights().subscribe({
      next: (res) => {
        this.insight = res.insight;
        this.insightLoading = false;
      },
      error: () => {
        this.insight = "Unable to load AI insights. Check if Google Gemini API key is configured in backend.";
        this.insightLoading = false;
      }
    });
  }

  initChart() {
    if (!this.stats) return;

    // Check if system prefers dark mode to adjust text colors
    const isDark = document.body.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const textColor = isDark ? '#f1f5f9' : '#0f172a';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';

    this.chartOptions = {
      series: [this.stats.wfoToday, this.stats.wfhToday, this.stats.onLeaveToday, this.stats.absentToday],
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 }
        },
        background: 'transparent'
      },
      labels: ['WFO', 'WFH', 'On Leave', 'Absent'],
      colors: ['#10b981', '#0ea5e9', '#f59e0b', '#f43f5e'],
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '78%',
            labels: {
              show: true,
              name: { fontSize: '13px', fontWeight: 600, color: subTextColor },
              value: { fontSize: '32px', fontWeight: 800, color: textColor },
              total: {
                show: true,
                showAlways: true,
                label: 'Present',
                fontSize: '13px',
                fontWeight: 600,
                color: subTextColor,
                formatter: function (w) {
                  return (w.globals.seriesTotals[0] + w.globals.seriesTotals[1]).toString()
                }
              }
            }
          }
        }
      },
      stroke: { width: 0 },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: { formatter: function (val) { return val + " Employees" } }
      },
      legend: { show: false }
    };
  }
}
