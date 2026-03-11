import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TeamComparison, WorkTrend } from '../../core/models/interfaces';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexTooltip,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexFill
} from 'ng-apexcharts';

export type TrendChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  colors: string[];
  stroke: ApexStroke;
  fill: ApexFill;
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10 animate-fade-in pb-12">
      <!-- High-Fidelity Header & Strategic Filters -->
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-3">
            Intelligence <span class="text-primary-600 dark:text-primary-400">Reports</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Cross-organizational attendance telemetry and trend analysis</p>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
          <div class="flex items-center gap-4 px-6 py-2 group">
            <span class="material-icons text-slate-400 text-lg group-hover:text-primary-500 transition-colors">calendar_today</span>
            <div class="flex flex-col">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vector Start</span>
              <input type="date" [(ngModel)]="startDate" (change)="loadData()" 
                     class="bg-transparent border-0 p-0 text-sm font-black text-slate-900 dark:text-white focus:ring-0 cursor-pointer outline-none">
            </div>
          </div>
          
          <div class="hidden sm:block w-px h-8 bg-slate-100 dark:bg-white/10"></div>
          
          <div class="flex items-center gap-4 px-6 py-2 group">
            <span class="material-icons text-slate-400 text-lg group-hover:text-primary-500 transition-colors">event</span>
            <div class="flex flex-col">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vector End</span>
              <input type="date" [(ngModel)]="endDate" (change)="loadData()" 
                     class="bg-transparent border-0 p-0 text-sm font-black text-slate-900 dark:text-white focus:ring-0 cursor-pointer outline-none">
            </div>
          </div>

          <button (click)="loadData()" class="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 hover:scale-105 transition-transform active:scale-95">
            <span class="material-icons text-xl">refresh</span>
          </button>
        </div>
      </div>

      <!-- Advanced Telemetry Chart Card -->
      <div class="glass-card overflow-hidden border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-4xl animate-slide-up">
        <div class="p-10 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white font-manrope tracking-tight flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <span class="material-icons text-xl">insights</span>
              </div>
              Work Location Dynamics
            </h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-13">Daily delta of operational environment distribution</p>
          </div>
          
          <div class="flex flex-wrap items-center gap-6 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-100 dark:border-white/5">
            <div class="flex items-center gap-3">
              <div class="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50"></div>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Hub (WFO)</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Remote (WFH)</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"></div>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Rest (Leave)</span>
            </div>
          </div>
        </div>
        
        <div class="p-10 min-h-[450px] relative">
          <apx-chart *ngIf="trendChartOptions"
            [series]="trendChartOptions.series"
            [chart]="trendChartOptions.chart"
            [xaxis]="trendChartOptions.xaxis"
            [yaxis]="trendChartOptions.yaxis"
            [stroke]="trendChartOptions.stroke"
            [tooltip]="trendChartOptions.tooltip"
            [dataLabels]="trendChartOptions.dataLabels"
            [colors]="trendChartOptions.colors"
            [legend]="trendChartOptions.legend"
            [fill]="trendChartOptions.fill"
            class="w-full"
          ></apx-chart>
          
          <div *ngIf="!trendChartOptions && workTrends.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/20 dark:bg-slate-900/20 animate-fade-in">
            <span class="material-icons text-6xl opacity-20 mb-4">analytics</span>
            <p class="text-xs font-black uppercase tracking-[0.3em]">No Telemetry Detected</p>
          </div>
        </div>
      </div>

      <!-- Tactical Comparison Grid -->
      <div class="glass-card overflow-hidden border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-4xl animate-slide-up" style="animation-delay: 150ms">
        <div class="p-10 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white font-manrope tracking-tight flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <span class="material-icons text-xl">radar</span>
              </div>
              Cross-Team Synchronization
            </h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-13">Benchmarking cluster performance metrics</p>
          </div>
          
          <button (click)="exportTeamComparisonPDF()" 
                  class="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 transition-all hover:shadow-2xl hover:shadow-slate-500/20 active:scale-95">
            <span class="material-icons text-xl group-hover:animate-bounce transition-transform">picture_as_pdf</span>
            <span class="text-[10px] font-black uppercase tracking-[0.2em]">Generate Intelligence PDF</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50/50 dark:bg-slate-800/30">
                <th class="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cluster Designation</th>
                <th class="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Nodes</th>
                <th class="px-6 py-6 text-center text-[10px] font-black text-emerald-500 uppercase tracking-widest">Presence Matrix</th>
                <th class="px-6 py-6 text-center text-[10px] font-black text-red-500 uppercase tracking-widest">Absence Delta</th>
                <th class="px-6 py-6 text-center text-[10px] font-black text-amber-500 uppercase tracking-widest">Rest State</th>
                <th class="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Rating</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-white/5">
              <tr *ngFor="let t of teamComparisons; trackBy: trackByTeamName; let i = index" 
                  class="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group animate-fade-in"
                  [style.animation-delay]="i * 50 + 'ms'">
                <td class="px-10 py-8">
                  <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-[1.2rem] bg-gradient-to-tr from-primary-500/10 to-indigo-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20 group-hover:rotate-12 transition-transform">
                      <span class="text-sm font-black font-manrope">{{ t.teamName.charAt(0) }}</span>
                    </div>
                    <div class="flex flex-col">
                       <span class="text-sm font-black text-slate-900 dark:text-white tracking-tight">{{ t.teamName }}</span>
                       <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Cluster</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-8 text-center">
                  <span class="text-sm font-black text-slate-900 dark:text-white tabular-nums">{{ t.totalEmployees }}</span>
                </td>
                <td class="px-6 py-8 text-center">
                  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span class="text-xs font-black tabular-nums">{{ t.totalPresent }}</span>
                  </div>
                </td>
                <td class="px-6 py-8 text-center">
                  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                    <span class="text-xs font-black tabular-nums">{{ t.totalAbsent }}</span>
                  </div>
                </td>
                <td class="px-6 py-8 text-center">
                  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <span class="text-xs font-black tabular-nums">{{ t.totalOnLeave }}</span>
                  </div>
                </td>
                <td class="px-10 py-8">
                  <div class="flex flex-col items-end gap-3">
                    <div class="flex items-center gap-3">
                      <span class="text-base font-black text-slate-900 dark:text-white tabular-nums leading-none">{{ t.attendanceRate }}%</span>
                      <div class="w-2 h-2 rounded-full" [class]="t.attendanceRate > 90 ? 'bg-emerald-500' : 'bg-amber-500'"></div>
                    </div>
                    <div class="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div class="h-full bg-gradient-to-r from-primary-500 to-indigo-600 shadow-lg shadow-primary-500/40 transform transition-transform duration-1000 origin-left" 
                           [style.width]="t.attendanceRate + '%'"></div>
                    </div>
                  </div>
                </td>
              </tr>
              
              <tr *ngIf="teamComparisons.length === 0">
                <td colspan="6" class="px-10 py-24 text-center text-slate-500 bg-slate-50/20 dark:bg-slate-900/20">
                  <div class="flex flex-col items-center">
                    <span class="material-icons text-5xl opacity-10 mb-6">biotech</span>
                    <p class="text-xs font-black uppercase tracking-[0.3em]">No Analysis Results Found</p>
                    <p class="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Modify temporal vectors to scan alternate data ranges</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';

  teamComparisons: TeamComparison[] = [];
  workTrends: WorkTrend[] = [];

  public trendChartOptions: Partial<TrendChartOptions> | any;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = lastMonth.toISOString().split('T')[0];
  }

  trackByTeamName(index: number, item: TeamComparison): string {
    return item.teamName;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.api.getTeamComparison(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.teamComparisons = res;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load team comparisons', err)
    });

    this.api.getWorkTrends(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.workTrends = res;
        this.renderChart();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load work trends', err)
    });
  }

  renderChart() {
    const dates = this.workTrends.map(t => t.date);
    const wfo = this.workTrends.map(t => t.wfoCount);
    const wfh = this.workTrends.map(t => t.wfhCount);
    const onLeave = this.workTrends.map(t => t.leaveCount);

    this.trendChartOptions = {
      series: [
        { name: 'WFO', data: wfo },
        { name: 'WFH', data: wfh },
        { name: 'On Leave', data: onLeave }
      ],
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        background: 'transparent'
      },
      colors: ['#4f46e5', '#10b981', '#f59e0b'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories: dates,
        type: 'datetime',
        labels: {
          style: { cssClass: 'text-xs font-sans fill-[var(--text-secondary)]' }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          style: { cssClass: 'text-xs font-sans fill-[var(--text-secondary)]' }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: 'var(--text-secondary)' }
      },
      tooltip: { theme: 'dark' }
    };
  }

  exportTeamComparisonPDF() {
    this.api.exportTeamComparison(this.startDate, this.endDate).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-comparison-${this.startDate}-to-${this.endDate}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Export failed', err)
    });
  }
}
