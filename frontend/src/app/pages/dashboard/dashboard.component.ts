import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10 animate-fade-in pb-12">
      <!-- Header Module -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-3">
            Intelligence <span class="text-primary-600 dark:text-primary-400">Dashboard</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">{{ getDashboardSubtitle() }}</p>
        </div>

        <div *ngIf="teams.length > 0" class="flex items-center gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 p-2 rounded-[1.5rem] shadow-sm">
          <span class="pl-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Context:</span>
          <select [(ngModel)]="selectedTeamId" (ngModelChange)="onTeamChange($event)"
                  class="text-sm px-6 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border-none shadow-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-bold min-w-[200px] text-slate-900 dark:text-white appearance-none cursor-pointer">
            <option [ngValue]="null">Organizational Core</option>
            <option *ngFor="let t of teams; trackBy: trackByTeamId" [ngValue]="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>

      <!-- Protocol Execution Card (Quick Check-in) -->
      <div class="relative group overflow-hidden rounded-[2.5rem] p-1 shadow-2xl shadow-primary-500/10">
        <div class="absolute inset-0 bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-700"></div>
        <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 animate-pulse"></div>
        
        <div class="relative bg-black/5 backdrop-blur-sm rounded-[2.4rem] p-8 md:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div class="flex items-start gap-6">
            <div class="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
               <span class="material-icons text-3xl text-white opacity-90">location_on</span>
            </div>
            <div>
              <h3 class="text-2xl font-black text-white font-manrope tracking-tight mb-2">Presence Protocol</h3>
              <p class="text-white/70 font-medium max-w-md" *ngIf="!checkedIn">Initialize your organizational presence for the current cycle.</p>
              <div class="flex items-center gap-3" *ngIf="checkedIn">
                <span class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Active Identity
                </span>
                <p class="text-white/90 font-bold">Checked in as {{ checkInStatus }}</p>
              </div>
            </div>
          </div>

          <div class="flex gap-4 shrink-0" *ngIf="!checkedIn">
            <button (click)="doCheckIn('WFO')" 
                    class="px-8 py-4 rounded-2xl bg-white text-primary-900 text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-black/10 hover:shadow-white/20 group/btn">
              <span class="flex items-center gap-2">
                <span class="material-icons text-sm transition-transform group-hover/btn:-translate-y-0.5">business</span>
                Static Office
              </span>
            </button>
            <button (click)="doCheckIn('WFH')" 
                    class="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-95 backdrop-blur-md border border-white/20 group/btn">
              <span class="flex items-center gap-2">
                <span class="material-icons text-sm transition-transform group-hover/btn:-translate-y-0.5">home</span>
                Remote Node
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Neural Insight Module -->
      <div class="glass-card rounded-[2rem] p-8 flex flex-col lg:flex-row items-center gap-8 group animate-fade-in ring-1 ring-slate-100 dark:ring-white/5 shadow-3xl">
         <div class="relative shrink-0">
           <div class="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-primary-500/20 to-indigo-500/20 flex items-center justify-center border border-primary-500/30">
              <span class="material-icons text-primary-500 text-3xl" [class.animate-spin]="insightLoading">psychology</span>
           </div>
           <div class="absolute -top-2 -right-2 bg-primary-600 text-[8px] font-black text-white px-2 py-0.5 rounded-full shadow-lg">CORE AI</div>
         </div>
         
         <div class="flex-1 text-center lg:text-left">
            <h3 class="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em] mb-3">Intelligent Synthesis</h3>
            <div *ngIf="insightLoading" class="space-y-2">
               <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-3/4 animate-pulse mx-auto lg:mx-0"></div>
               <div class="h-3 bg-slate-50 dark:bg-slate-800/50 rounded-full w-full animate-pulse mx-auto lg:mx-0"></div>
            </div>
            <p *ngIf="!insightLoading" class="text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug font-manrope tracking-tight">
               {{ insight || 'Awaiting synchronization with intelligence core...' }}
            </p>
         </div>

         <button *ngIf="!insightLoading" (click)="loadInsight()" 
                 class="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-primary-500 transition-all transform active:scale-90 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <span class="material-icons">refresh</span>
         </button>
      </div>

      <!-- Tactical Analytics (Stats) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <!-- Metric Cards with Glassmorphism -->
        <div *ngFor="let m of [
          { label: 'Personnel', value: stats?.totalEmployees, sub: 'Total Strength', icon: 'people', color: 'primary', delay: '100ms' },
          { label: 'Deployed', value: stats?.presentToday, sub: presentPercentage + '% Efficiency', icon: 'sensors', color: 'emerald', delay: '200ms' },
          { label: 'Standby', value: stats?.onLeaveToday, sub: (stats?.pendingLeaves || 0) + ' Awaiting', icon: 'event_busy', color: 'amber', delay: '300ms' },
          { label: 'Offline', value: stats?.absentToday, sub: 'Current Delta', icon: 'person_off', color: 'rose', delay: '400ms' }
        ]; trackBy: trackByMetricId"
             class="glass-card p-8 group hover:scale-[1.02] transition-all duration-500 animate-slide-up relative overflow-hidden"
             [style.animation-delay]="m.delay">
          
          <div class="flex items-center justify-between mb-8 relative z-10">
            <div [class]="'w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors shadow-sm group-hover:shadow-lg ' + 
               (m.color === 'emerald' ? 'bg-emerald-50/50 border-emerald-500/20 text-emerald-600 dark:bg-emerald-500/10' : 
                m.color === 'amber' ? 'bg-amber-50/50 border-amber-500/20 text-amber-600 dark:bg-amber-500/10' : 
                m.color === 'rose' ? 'bg-rose-50/50 border-rose-500/20 text-rose-600 dark:bg-rose-500/10' : 
                'bg-primary-50/50 border-primary-500/20 text-primary-600 dark:bg-primary-500/10')">
              <span class="material-icons text-2xl group-hover:scale-110 transition-transform">{{ m.icon }}</span>
            </div>
            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{{ m.label }}</span>
          </div>

          <h4 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tighter mb-2 relative z-10">
            {{ m.value || 0 }}
          </h4>
          <p class="text-[11px] font-bold text-slate-500/70 uppercase tracking-widest relative z-10">{{ m.sub }}</p>

          <!-- Status specific breakdown for deployed card -->
          <div *ngIf="m.label === 'Deployed'" class="flex gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/50 relative z-10">
             <div class="flex-1 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                <span class="block text-[10px] font-black text-emerald-600/80 mb-0.5">WFO</span>
                <span class="text-sm font-black text-emerald-900 dark:text-emerald-100">{{ stats?.wfoToday || 0 }}</span>
             </div>
             <div class="flex-1 p-2 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                <span class="block text-[10px] font-black text-blue-600/80 mb-0.5">WFH</span>
                <span class="text-sm font-black text-indigo-900 dark:text-indigo-100">{{ stats?.wfhToday || 0 }}</span>
             </div>
          </div>

          <!-- Absolute decorative bg element -->
          <div [class]="'absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ' + 
             (m.color === 'emerald' ? 'bg-emerald-500' : 
              m.color === 'amber' ? 'bg-amber-500' : 
              m.color === 'rose' ? 'bg-rose-500' : 
              'bg-primary-500')"></div>
        </div>
      </div>

      <!-- Strategic Visualizer & Intelligence Stream -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        <!-- Interactive Analytics Engine -->
        <div class="glass-card p-10 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden group">
          <div class="w-full flex items-center justify-between mb-10 relative z-10">
             <div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-2">Tactical Distribution</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Analysis of Forces</p>
             </div>
             <div class="w-12 h-12 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center text-slate-400">
                <span class="material-icons">pie_chart</span>
             </div>
          </div>

          <div *ngIf="chartOptions" class="w-full flex justify-center animate-scale-in z-10 mb-8" id="chart">
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

          <!-- Sophisticated Legend Interface -->
          <div *ngIf="chartOptions" class="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full animate-slide-up stagger-1 z-10">
            <div *ngFor="let l of [
              { color: '#10b981', label: 'WFO', val: stats?.wfoToday },
              { color: '#3b82f6', label: 'WFH', val: stats?.wfhToday },
              { color: '#f59e0b', label: 'LEAVE', val: stats?.onLeaveToday },
              { color: '#ef4444', label: 'AWOL', val: stats?.absentToday }
            ]" class="flex flex-col items-center p-3 rounded-2xl bg-white/30 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-700/50">
              <span class="w-2 h-2 rounded-full mb-2" [style.backgroundColor]="l.color"></span>
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ l.label }}</span>
              <span class="text-lg font-black text-slate-900 dark:text-white mt-1">{{ l.val || 0 }}</span>
            </div>
          </div>

          <div *ngIf="!chartOptions" class="flex flex-col items-center justify-center h-64 z-10">
             <div class="relative w-16 h-16 mb-6">
                <div class="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
             </div>
             <p class="text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Computing Matrix...</p>
          </div>

          <!-- Decorative Kinetic Elements -->
          <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-500/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
          <div class="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
        </div>

        <!-- System Delta Module -->
        <div class="glass-card p-10 relative overflow-hidden group">
          <div class="w-full flex items-center justify-between mb-10 relative z-10">
             <div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-2">Delta Intelligence</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active System Parameters</p>
             </div>
             <div class="w-12 h-12 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center text-slate-400">
                <span class="material-icons">architecture</span>
             </div>
          </div>

          <div class="space-y-6 relative z-10">
            <div *ngFor="let item of [
              { label: 'Synchronization State', val: 'Full Synergy', icon: 'sync', color: 'primary', desc: 'Backend systems operating at peak performance' },
              { label: 'Pending Leave Assets', val: stats?.pendingLeaves || 0, icon: 'approval', color: 'amber', desc: 'Critical human resource decisions required' },
              { label: 'Upcoming Neural Breaks', val: stats?.upcomingHolidays || 0, icon: 'auto_awesome', color: 'violet', desc: 'Scheduled organizational downtime approaching' }
            ]" class="flex items-center gap-6 p-6 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-slate-100/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-default group/item shadow-sm">
              <div [class]="'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover/item:scale-110 transition-transform ' + 
                (item.color === 'amber' ? 'bg-amber-500/10 text-amber-600' : 
                 item.color === 'violet' ? 'bg-violet-500/10 text-violet-600' : 
                 'bg-primary-500/10 text-primary-600')">
                <span class="material-icons">{{ item.icon }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-black text-slate-800 dark:text-slate-200 font-manrope tracking-tight">{{ item.label }}</span>
                  <span [class]="'text-sm font-black uppercase tracking-widest px-3 py-1 rounded-lg ' + 
                    (item.color === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                     item.color === 'violet' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 
                     'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400')">
                    {{ item.val }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 font-medium leading-tight truncate">{{ item.desc }}</p>
              </div>
            </div>
          </div>
          
          <!-- Decorative Kinetic Elements -->
          <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
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

  constructor(private api: ApiService, public authService: AuthService, public cdr: ChangeDetectorRef) { }

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
      this.api.getTeams().subscribe({
        next: (t) => {
          this.teams = t;
          this.cdr.markForCheck();
        }
      });
    }
  }

  loadStats() {
    const obs = this.selectedTeamId
      ? this.api.getTeamDashboardStats(this.selectedTeamId)
      : this.api.getDashboardStats();

    obs.subscribe({
      next: (data) => {
        this.stats = data;
        this.initChart();
        this.cdr.markForCheck();
      },
      error: () => {
        this.stats = { totalEmployees: 0, presentToday: 0, wfoToday: 0, wfhToday: 0, onLeaveToday: 0, absentToday: 0, pendingLeaves: 0, upcomingHolidays: 0 };
        this.initChart();
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
    this.api.checkIn(status).subscribe({
      next: () => {
        this.checkedIn = true;
        this.checkInStatus = status;
        this.checkInLoading = false;
        this.loadStats(); // Refresh stats after check-in
        this.cdr.markForCheck();
      },
      error: () => {
        this.checkInLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadInsight() {
    this.insightLoading = true;
    this.cdr.markForCheck();
    this.api.getDashboardInsights().subscribe({
      next: (res) => {
        this.insight = res.insight;
        this.insightLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.insight = "Unable to load AI insights. Check if Google Gemini API key is configured in backend.";
        this.insightLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  initChart() {
    if (!this.stats) return;

    // Check if system prefers dark mode to adjust text colors
    const isDark = document.body.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';

    this.chartOptions = {
      series: [this.stats.wfoToday, this.stats.wfhToday, this.stats.onLeaveToday, this.stats.absentToday],
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: 'Manrope, system-ui, sans-serif',
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 }
        },
        background: 'transparent'
      },
      labels: ['WFO', 'WFH', 'On Leave', 'Absent'],
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: { fontSize: '14px', fontWeight: 600, color: subTextColor },
              value: { fontSize: '32px', fontWeight: 800, color: textColor },
              total: {
                show: true,
                showAlways: true,
                label: 'Present',
                fontSize: '14px',
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

  trackByTeamId(index: number, team: Team): number {
    return team.id;
  }

  trackByMetricId(index: number, metric: any): string {
    return metric.label + index;
  }
}
