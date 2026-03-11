import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { MonthlySummary } from '../../core/models/interfaces';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10 animate-fade-in pb-12">
      <!-- High-Fidelity Header & Chronological Filters -->
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-3">
            Monthly <span class="text-primary-600 dark:text-primary-400">Intelligence</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Aggregated attendance analytics and performance summaries</p>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
          <div class="flex items-center gap-4 px-6 py-2 group">
            <span class="material-icons text-slate-400 text-lg group-hover:text-primary-500 transition-colors">calendar_month</span>
            <div class="flex flex-col">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Temporal Month</span>
              <select [(ngModel)]="selectedMonth" (change)="loadSummary()" 
                      class="bg-transparent border-0 p-0 text-sm font-black text-slate-900 dark:text-white focus:ring-0 cursor-pointer outline-none appearance-none pr-8">
                <option *ngFor="let m of months" [ngValue]="m.value">{{ m.label }}</option>
              </select>
            </div>
          </div>
          
          <div class="hidden sm:block w-px h-8 bg-slate-100 dark:bg-white/10"></div>
          
          <div class="flex items-center gap-4 px-6 py-2 group">
            <span class="material-icons text-slate-400 text-lg group-hover:text-primary-500 transition-colors">history</span>
            <div class="flex flex-col">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fiscal Year</span>
              <select [(ngModel)]="selectedYear" (change)="loadSummary()" 
                      class="bg-transparent border-0 p-0 text-sm font-black text-slate-900 dark:text-white focus:ring-0 cursor-pointer outline-none appearance-none pr-8">
                <option *ngFor="let y of years" [ngValue]="y">{{ y }}</option>
              </select>
            </div>
          </div>

          <button *ngIf="authService.isManager" (click)="generateSummary()" 
                  class="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/20 transition-all transform active:scale-95">
            <span class="material-icons text-xl group-hover:rotate-180 transition-transform">bolt</span>
            <span class="text-[10px] font-black uppercase tracking-widest">Generate Delta</span>
          </button>
        </div>
      </div>

      <!-- Advanced Intelligence Grid -->
      <div class="glass-card overflow-hidden border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-4xl animate-slide-up">
        <div class="p-10 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
          <h2 class="text-xl font-black text-slate-900 dark:text-white font-manrope tracking-tight flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <span class="material-icons text-xl">dataset</span>
            </div>
            Personnel Aggregation Matrix
          </h2>
          <div class="px-4 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
             <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ summaries.length }} Nodes Processed</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50/50 dark:bg-slate-800/30">
                <th class="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Node</th>
                <th class="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">WFO</th>
                <th class="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">WFH</th>
                <th class="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Rest</th>
                <th class="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Holi</th>
                <th class="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Abse</th>
                <th class="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Bench</th>
                <th class="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Train</th>
                <th class="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Days</th>
                <th class="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Hours</th>
                <th class="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance %</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-white/5">
              <tr *ngFor="let s of summaries; trackBy: trackByEmployeeId; let i = index" 
                  class="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group animate-fade-in"
                  [style.animation-delay]="i * 50 + 'ms'">
                <td class="px-10 py-6">
                  <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-[1.2rem] bg-gradient-to-tr from-primary-500/10 to-indigo-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20 group-hover:rotate-12 transition-transform">
                      <span class="text-sm font-black font-manrope">{{ s.employeeName.charAt(0) }}</span>
                    </div>
                    <div class="flex flex-col">
                       <span class="text-sm font-black text-slate-900 dark:text-white tracking-tight">{{ s.employeeName }}</span>
                       <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ s.employeeCode }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-6 text-center">
                  <span class="px-2.5 py-1 text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg tabular-nums">{{ s.wfoCount }}</span>
                </td>
                <td class="px-4 py-6 text-center">
                  <span class="px-2.5 py-1 text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg tabular-nums">{{ s.wfhCount }}</span>
                </td>
                <td class="px-4 py-6 text-center">
                  <span class="px-2.5 py-1 text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg tabular-nums">{{ s.leaveCount }}</span>
                </td>
                <td class="px-4 py-6 text-center">
                  <span class="px-2.5 py-1 text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg tabular-nums">{{ s.holidayCount }}</span>
                </td>
                <td class="px-4 py-6 text-center">
                  <span class="px-2.5 py-1 text-[10px] font-black bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg tabular-nums">{{ s.absentCount }}</span>
                </td>
                <td class="px-4 py-6 text-center">
                  <span class="px-2.5 py-1 text-[10px] font-black bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-lg tabular-nums">{{ s.benchCount }}</span>
                </td>
                <td class="px-4 py-6 text-center">
                  <span class="px-2.5 py-1 text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg tabular-nums">{{ s.trainingCount }}</span>
                </td>
                <td class="px-4 py-6 text-center">
                  <span class="text-xs font-black text-slate-900 dark:text-white tabular-nums">{{ s.totalWorkingDays }}</span>
                </td>
                <td class="px-4 py-6 text-center">
                  <span class="text-xs font-black text-slate-900 dark:text-white tabular-nums">{{ s.totalWorkingHours }}</span>
                </td>
                <td class="px-10 py-6">
                  <div class="flex flex-col items-end gap-3">
                    <div class="flex items-center gap-3">
                      <span class="text-base font-black text-slate-900 dark:text-white tabular-nums leading-none">{{ s.attendancePercentage.toFixed(1) }}%</span>
                      <div class="w-2 h-2 rounded-full" 
                           [class]="s.attendancePercentage >= 80 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 
                                   (s.attendancePercentage >= 50 ? 'bg-amber-500 shadow-lg shadow-amber-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50')"></div>
                    </div>
                    <div class="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div class="h-full transform transition-transform duration-1000 origin-left"
                           [class.bg-emerald-500]="s.attendancePercentage >= 80"
                           [class.bg-amber-500]="s.attendancePercentage >= 50 && s.attendancePercentage < 80"
                           [class.bg-red-500]="s.attendancePercentage < 50"
                           [style.width.%]="s.attendancePercentage"></div>
                    </div>
                  </div>
                </td>
              </tr>
              
              <tr *ngIf="summaries.length === 0">
                <td colspan="11" class="px-10 py-24 text-center text-slate-500 bg-slate-50/20 dark:bg-slate-900/20">
                  <div class="flex flex-col items-center">
                    <span class="material-icons text-5xl opacity-10 mb-6">dataset</span>
                    <p class="text-xs font-black uppercase tracking-[0.3em]">Zero Aggregation Data</p>
                    <p class="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest font-manrope">Execute delta generation to populate this temporal frame</p>
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
export class SummaryComponent implements OnInit {
  summaries: MonthlySummary[] = [];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleString('default', { month: 'long' })
  }));

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(private api: ApiService, public authService: AuthService, private cdr: ChangeDetectorRef) { }

  trackByEmployeeId(index: number, item: MonthlySummary): string {
    return item.employeeCode;
  }

  ngOnInit() { this.loadSummary(); }

  loadSummary() {
    this.api.getMonthlySummary(this.selectedMonth, this.selectedYear).subscribe(data => {
      this.summaries = data;
      this.cdr.markForCheck();
    });
  }

  generateSummary() {
    this.api.generateSummary(this.selectedMonth, this.selectedYear).subscribe(data => {
      this.summaries = data;
      this.cdr.markForCheck();
    });
  }
}
