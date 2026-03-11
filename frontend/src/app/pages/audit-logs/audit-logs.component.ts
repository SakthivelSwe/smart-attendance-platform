import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuditLog } from '../../core/models/interfaces';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 animate-fade-in pb-20">
      <!-- High-Fidelity Header & Strategic Controls -->
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-3">
            Systemic <span class="text-primary-600 dark:text-primary-400">Provenance</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Digital ledger of administrative actions and architectural mutations</p>
        </div>

        <div class="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
           <div class="px-6 py-2.5 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
             Total Records: <span class="text-slate-900 dark:text-white tabular-nums">{{ totalElements }}</span>
           </div>
           
           <button (click)="loadLogs()" [disabled]="isLoading" 
                   class="group flex items-center gap-3 px-8 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/20 transition-all transform active:scale-95">
             <span class="material-icons text-xl group-hover:rotate-180 transition-transform" [class.animate-spin]="isLoading">sync</span>
             <span class="text-[10px] font-black uppercase tracking-widest">Synchronize Ledger</span>
           </button>
        </div>
      </div>

      <!-- High-Fidelity Provenance Ledger -->
      <div class="glass-card p-0 overflow-hidden border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-4xl animate-zoom-in">
        <!-- Table Loader -->
        <div *ngIf="isLoading" class="absolute inset-0 z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center gap-6 animate-fade-in">
           <div class="relative w-20 h-20">
             <div class="absolute inset-0 border-4 border-primary-500/10 rounded-full"></div>
             <div class="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
           </div>
           <p class="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 animate-pulse">Retrieving Provenance Data</p>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr class="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                <th class="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Delta</th>
                <th class="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Origin Node</th>
                <th class="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Action Vector</th>
                <th class="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Qualitative Metadata</th>
                <th class="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Network Point</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-white/5">
              <tr *ngFor="let log of logs; trackBy: trackByLogId" class="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors border-0">
                <td class="py-8 px-10">
                   <div class="flex flex-col gap-1">
                     <span class="text-xs font-black text-slate-900 dark:text-white tabular-nums">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                     <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ log.timestamp | date:'MMM dd, yyyy' }}</span>
                   </div>
                </td>
                <td class="py-8 px-10">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-xs text-slate-900 dark:text-white shadow-inner group-hover:scale-110 transition-transform"
                         [ngClass]="{'bg-primary-500/10 text-primary-600': log.username !== 'SYSTEM'}">
                      {{ log.username.charAt(0) }}
                    </div>
                    <span class="text-xs font-black text-slate-900 dark:text-white tracking-tight uppercase">{{ log.username }}</span>
                  </div>
                </td>
                <td class="py-8 px-10">
                  <span class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all"
                        [ngClass]="{
                          'bg-emerald-500/10 text-emerald-600 border-emerald-500/20': log.actionType.startsWith('CREATE'),
                          'bg-amber-500/10 text-amber-600 border-amber-500/20': log.actionType.startsWith('UPDATE'),
                          'bg-rose-500/10 text-rose-600 border-rose-500/20': log.actionType.startsWith('DELETE'),
                          'bg-primary-500/10 text-primary-600 border-primary-500/20': !log.actionType.startsWith('CREATE') && !log.actionType.startsWith('UPDATE') && !log.actionType.startsWith('DELETE')
                        }">
                    {{ log.actionType.replace('_', ' ') }}
                  </span>
                </td>
                <td class="py-8 px-10">
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm line-clamp-2 italic">{{ log.details }}</p>
                </td>
                <td class="py-8 px-10">
                  <span class="text-[10px] font-black text-slate-400 tabular-nums font-mono opacity-60 hover:opacity-100 transition-opacity">{{ log.ipAddress }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Null State: Void Ledger -->
        <div *ngIf="!isLoading && logs.length === 0" class="min-h-[400px] flex flex-col items-center justify-center p-20 text-center animate-fade-in">
           <div class="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 shadow-inner">
             <span class="material-icons text-5xl text-slate-200 dark:text-white/5">history</span>
           </div>
           <h3 class="text-2xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Provenance Data</h3>
           <p class="text-[10px] font-bold text-slate-400 mt-6 max-w-xs uppercase tracking-widest leading-loose">No systemic movements detected in the current temporal frame. Operations are currently silent.</p>
        </div>

        <!-- Tactical Pagination -->
        <div *ngIf="!isLoading && logs.length > 0" 
             class="px-10 py-8 border-t border-slate-50 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-white/[0.01]">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Temporal Frame <span class="text-slate-900 dark:text-white tabular-nums">{{ page + 1 }}</span> of <span class="text-slate-900 dark:text-white tabular-nums">{{ totalPages }}</span>
          </div>
          
          <div class="flex items-center gap-3">
             <button (click)="prevPage()" [disabled]="page === 0"
                     class="group p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-600 disabled:opacity-20 border border-slate-100 dark:border-white/5 transition-all active:scale-90 flex items-center gap-2 pr-6">
                <span class="material-icons text-sm">west</span>
                <span class="text-[9px] font-black uppercase tracking-widest">Rewind</span>
             </button>
             <button (click)="nextPage()" [disabled]="page >= totalPages - 1"
                     class="group p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-600 disabled:opacity-20 border border-slate-100 dark:border-white/5 transition-all active:scale-90 flex items-center gap-2 pl-6">
                <span class="text-[9px] font-black uppercase tracking-widest">Forward</span>
                <span class="material-icons text-sm">east</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  page = 0;
  size = 50;
  totalElements = 0;
  totalPages = 0;
  isLoading = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) { }

  trackByLogId(index: number, log: AuditLog): number { return log.id; }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.api.getAuditLogs(this.page, this.size).subscribe({
      next: (res) => {
        this.logs = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load audit logs', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadLogs();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadLogs();
    }
  }
}
