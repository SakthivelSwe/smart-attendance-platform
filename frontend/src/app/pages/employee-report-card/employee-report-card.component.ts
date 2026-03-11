import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { EmployeeReportCard } from '../../core/models/interfaces';

@Component({
  selector: 'app-employee-report-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 animate-fade-in pb-20">
      <!-- High-Fidelity Header & Analytical Controls -->
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-3">
            Personnel <span class="text-primary-600 dark:text-primary-400">Analytical</span> Matrix
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Decisive structural insights into human resource temporal deployment</p>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
          <div class="flex items-center gap-4 px-6 py-2">
            <div class="flex flex-col">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Temporal Ingress</span>
              <input type="date" [(ngModel)]="startDate" (change)="loadData()" 
                     class="bg-transparent border-0 p-0 text-xs font-black text-slate-900 dark:text-white focus:ring-0 cursor-pointer tabular-nums">
            </div>
            <div class="w-px h-8 bg-slate-100 dark:bg-white/5"></div>
            <div class="flex flex-col">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Temporal Egress</span>
              <input type="date" [(ngModel)]="endDate" (change)="loadData()" 
                     class="bg-transparent border-0 p-0 text-xs font-black text-slate-900 dark:text-white focus:ring-0 cursor-pointer tabular-nums">
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <button (click)="exportCSV()" 
                    class="group flex items-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 shadow-xl transition-all transform hover:-translate-y-1 active:scale-95">
              <span class="material-icons text-xl text-emerald-500 group-hover:rotate-12 transition-transform">pivot_table_chart</span>
              <span class="text-[10px] font-black uppercase tracking-[0.2em]">CSV Export</span>
            </button>
            <button (click)="exportExcel()" 
                    class="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/30 transition-all transform hover:-translate-y-1 active:scale-95">
              <span class="material-icons text-xl group-hover:scale-110 transition-transform">file_download</span>
              <span class="text-[10px] font-black uppercase tracking-[0.2em]">Excel Commit</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tactical Search Vector -->
      <div class="max-w-2xl relative group">
        <div class="absolute inset-0 bg-primary-500/5 rounded-3xl blur-xl group-hover:bg-primary-500/10 transition-all"></div>
        <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons text-xl transition-transform group-focus-within:scale-110">search_check</span>
        <input type="text" [(ngModel)]="searchQuery" (input)="applyFilter()"
               placeholder="Identify Personnel Node, ID, or Structural Collective..." 
               class="relative w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-3xl pl-16 pr-8 py-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 transition-all shadow-2xl">
      </div>

      <!-- Analytical Matrix: High-Fidelity Nodes -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        <div *ngFor="let card of filteredCards; trackBy: trackByEmployeeId"
             class="glass-card group p-0 overflow-hidden border-slate-100 dark:border-white/5 hover:border-primary-500/20 shadow-xl hover:shadow-4xl transition-all duration-500 animate-slide-up transform hover:-translate-y-2">
          
          <div class="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <span class="material-icons text-[100px] -rotate-12 transition-transform group-hover:rotate-0">analytics</span>
          </div>

          <!-- Personnel Identity Vector -->
          <div class="p-8 pb-0">
            <div class="flex items-center gap-5 mb-8">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-2xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all">
                {{ card.employeeName.charAt(0) }}
              </div>
              <div class="min-w-0">
                <h3 class="text-base font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-tight uppercase truncate group-hover:text-primary-600 transition-colors">{{ card.employeeName }}</h3>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{{ card.employeeCode || 'VOID' }} • {{ card.teamName || 'NO COLLECTIVE' }}</p>
              </div>
            </div>

            <!-- Strategic Efficacy Vector -->
            <div class="relative bg-slate-50 dark:bg-white/[0.02] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-inner flex flex-col items-center justify-center">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Deployment Efficacy</span>
              <div class="flex items-end gap-2">
                <span class="text-5xl font-black tabular-nums font-manrope tracking-tighter leading-none" 
                      [ngClass]="{
                        'text-emerald-500': card.attendanceRate >= 90,
                        'text-amber-500': card.attendanceRate < 90 && card.attendanceRate >= 75,
                        'text-rose-500': card.attendanceRate < 75
                      }">{{ card.attendanceRate }}</span>
                <span class="text-lg font-black text-slate-300 dark:text-white/10 mb-1 font-outfit">%</span>
              </div>
              
              <!-- Mini Sparkline visualization simulation -->
              <div class="w-full mt-6 h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000 shadow-lg"
                     [ngClass]="{
                        'bg-emerald-500 shadow-emerald-500/20': card.attendanceRate >= 90,
                        'bg-amber-500 shadow-amber-500/20': card.attendanceRate < 90 && card.attendanceRate >= 75,
                        'bg-rose-500 shadow-rose-500/20': card.attendanceRate < 75
                     }"
                     [style.width.%]="card.attendanceRate"></div>
              </div>
            </div>
          </div>

          <!-- Structural Distribution Matrix -->
          <div class="p-8 grid grid-cols-2 gap-x-10 gap-y-6 mt-4 border-t border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
            <div class="flex flex-col">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Temporal Capacity</span>
              <span class="text-sm font-black text-slate-900 dark:text-white tabular-nums">{{ card.totalWorkingDays }} <span class="text-[8px] text-slate-400 ml-1">WORK</span></span>
            </div>
            <div class="flex flex-col">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Present Nodes</span>
              <span class="text-sm font-black text-emerald-600 tabular-nums">{{ card.totalPresent }} <span class="text-[8px] text-slate-400 ml-1">ACTIVE</span></span>
            </div>
            <div class="flex flex-col">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Absent Vectors</span>
              <span class="text-sm font-black text-rose-500 tabular-nums">{{ card.totalAbsent }} <span class="text-[8px] text-slate-400 ml-1">VOID</span></span>
            </div>
            <div class="flex flex-col">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hybrid/Leave</span>
              <div class="flex items-center gap-2">
                <span class="text-sm font-black text-amber-500 tabular-nums">{{ card.totalOnLeave }}<span class="text-[9px] text-slate-300 ml-1">L</span></span>
                <span class="w-px h-3 bg-slate-200 dark:bg-white/10"></span>
                <span class="text-sm font-black text-indigo-500 tabular-nums">{{ card.wfhDays }}<span class="text-[9px] text-slate-300 ml-1">H</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Null Reality State -->
      <div *ngIf="filteredCards.length === 0"
           class="min-h-[500px] flex flex-col items-center justify-center p-20 animate-fade-in text-center">
        <div class="relative mb-12 w-32 h-32 flex items-center justify-center">
          <div class="absolute inset-0 bg-slate-100 dark:bg-white/5 rounded-[3rem] animate-pulse"></div>
          <span class="material-icons text-7xl text-slate-200 dark:text-white/5 relative z-10">person_search</span>
        </div>
        <h3 class="text-3xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Analytical Hits</h3>
        <p class="text-[10px] font-bold text-slate-400 mt-6 max-w-sm uppercase tracking-widest leading-loose">No structural personnel data detected within the current search vector and temporal boundaries.</p>
        <button (click)="searchQuery = ''; applyFilter()" 
                class="mt-12 px-10 py-5 rounded-2xl border-2 border-slate-100 dark:border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-50 transition-all">Reset Matrix Vector</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class EmployeeReportCardComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  reportCards: EmployeeReportCard[] = [];
  filteredCards: EmployeeReportCard[] = [];
  searchQuery: string = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = lastMonth.toISOString().split('T')[0];
  }

  trackByEmployeeId(index: number, item: EmployeeReportCard): any {
    return item.employeeId || item.employeeCode || index;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.api.getEmployeeReportCards(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.reportCards = res;
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load employee cards', err);
        this.cdr.markForCheck();
      }
    });
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase();
    this.filteredCards = this.reportCards.filter(card =>
      card.employeeName.toLowerCase().includes(q) ||
      (card.employeeCode && card.employeeCode.toLowerCase().includes(q)) ||
      (card.teamName && card.teamName.toLowerCase().includes(q))
    );
    this.cdr.markForCheck();
  }

  exportExcel() {
    this.api.exportEmployeeCards(this.startDate, this.endDate, 'excel').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employee-report-cards-${this.startDate}-to-${this.endDate}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Excel Export failed', err)
    });
  }

  exportCSV() {
    this.api.exportEmployeeCards(this.startDate, this.endDate, 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employee-report-cards-${this.startDate}-to-${this.endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('CSV Export failed', err)
    });
  }
}
