import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Holiday } from '../../core/models/interfaces';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-20">
      <!-- High-Fidelity Header & Strategic Intent -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-slate-100 dark:border-white/5">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="w-12 h-1 bg-primary-600 rounded-full"></span>
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 dark:text-primary-400">Temporal Architecture</span>
          </div>
          <h1 class="text-5xl font-black text-slate-900 dark:text-white font-manrope tracking-tighter leading-none mb-4">
            Operational <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">Exceptions</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-bold max-w-xl leading-relaxed tracking-tight">Managing company-wide holidays and structural downtimes within the organizational lifecycle.</p>
        </div>
        
        <div class="flex items-center gap-4">
          <button *ngIf="authService.isManager" (click)="openModal()" 
                  class="group flex items-center gap-4 px-10 py-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500">
            <span class="material-icons text-xl group-hover:rotate-180 transition-transform duration-700">edit_calendar</span>
            <span class="text-[10px] font-black uppercase tracking-[0.3em]">Register Exception</span>
          </button>
        </div>
      </div>

      <!-- Exception Matrix: Neural Nodes -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div *ngFor="let h of holidays; trackBy: trackByHolidayId; let i = index" 
             class="glass-card group p-0 overflow-hidden border-slate-100 dark:border-white/5 hover:border-primary-500/20 shadow-xl hover:shadow-4xl transition-all duration-700 animate-slide-up transform hover:-translate-y-3 rounded-[3rem]"
             [style.animation-delay]="i * 100 + 'ms'">
          
          <div class="absolute top-0 right-0 w-32 h-32 -mt-10 -mr-10 rounded-full bg-gradient-to-tr from-transparent opacity-10 group-hover:scale-150 transition-transform duration-1000"
               [class.to-primary-500]="!h.isOptional" [class.to-amber-500]="h.isOptional"></div>

          <div class="p-12 pb-8 relative">
            <div class="flex items-start justify-between mb-10">
              <div class="space-y-4">
                <div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                   <span class="material-icons text-[14px] text-primary-500">event</span>
                   <span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest tabular-nums">{{ h.date | date:'longDate' }}</span>
                </div>
                <h3 class="text-2xl font-black text-slate-900 dark:text-white font-manrope tracking-tighter uppercase leading-none group-hover:text-primary-600 transition-colors">{{ h.name }}</h3>
              </div>
              
              <div [class]="h.isOptional ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-primary-500/10 text-primary-600 border-primary-500/20'"
                   class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-inner">
                {{ h.isOptional ? 'Optional' : 'Static' }}
              </div>
            </div>

            <p *ngIf="h.description" class="text-xs font-bold text-slate-400 leading-relaxed italic border-l-4 border-slate-100 dark:border-white/5 pl-6 mb-10 group-hover:text-slate-500 transition-colors">{{ h.description }}</p>

            <div *ngIf="authService.isManager" class="flex gap-4 pt-10 border-t border-slate-100 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
              <button (click)="editHoliday(h)" 
                      class="flex-1 flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-500/5 hover:bg-primary-500 hover:text-white rounded-2xl transition-all shadow-lg hover:shadow-primary-500/20">
                <span class="material-icons text-sm">tune</span>
                Configure
              </button>
              <button (click)="deleteHoliday(h.id)" 
                      class="w-14 h-14 flex items-center justify-center text-rose-600 bg-rose-500/5 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-lg hover:shadow-rose-500/20">
                <span class="material-icons text-xl">delete_sweep</span>
              </button>
            </div>
          </div>
          
          <div class="h-2 w-full bg-slate-100 dark:bg-white/5 relative overflow-hidden">
             <div class="h-full transform transition-transform duration-1000 origin-left scale-x-0 group-hover:scale-x-100"
                  [class.bg-primary-500]="!h.isOptional" [class.bg-amber-500]="h.isOptional"></div>
          </div>
        </div>
      </div>

      <!-- Null State: Temporal Void -->
      <div *ngIf="holidays.length === 0" class="min-h-[500px] flex flex-col items-center justify-center p-20 text-center animate-fade-in group">
        <div class="relative mb-12 w-32 h-32 flex items-center justify-center">
          <div class="absolute inset-0 bg-primary-500/10 rounded-[3rem] animate-pulse scale-125"></div>
          <span class="material-icons text-7xl text-slate-200 dark:text-white/5 relative z-10 group-hover:scale-110 transition-transform duration-700">beach_access</span>
        </div>
        <h3 class="text-3xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Exceptions</h3>
        <p class="text-[10px] font-bold text-slate-400 mt-6 max-w-sm uppercase tracking-widest leading-loose">The temporal nexus identifies no registered exceptions. Operations are continuous across all sectors.</p>
        <button (click)="openModal()" class="mt-12 px-10 py-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-xl">Initialize First Exception</button>
      </div>

      <!-- Strategic Modal: Exception Formulation -->
      <div *ngIf="showModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-fade-in">
        <div class="glass-card w-full max-w-xl p-0 overflow-hidden ring-1 ring-white/10 shadow-5xl animate-zoom-in border-0 rounded-[3.5rem] bg-white dark:bg-slate-950">
          <div class="px-12 py-12 bg-slate-900 dark:bg-black text-white relative">
            <h3 class="text-3xl font-black font-manrope tracking-tight leading-none mb-2">{{ editingId ? 'Refine Exception' : 'Formulate Exception' }}</h3>
            <p class="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Temporal Parameter Matrix</p>
            <button (click)="showModal = false; cdr.markForCheck()" class="absolute top-12 right-12 text-white/40 hover:text-white transition-colors">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="p-12 space-y-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Designation Alias</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">badge</span>
                  <input type="text" [(ngModel)]="form.name" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="Holiday Code">
                </div>
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Temporal Vector</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">event</span>
                  <input type="date" [(ngModel)]="form.date" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all">
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Contextual Metadata</label>
              <div class="relative">
                <span class="absolute left-6 top-6 text-primary-500 material-icons">description</span>
                <textarea [(ngModel)]="form.description" rows="3" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all resize-none" placeholder="Contextual details regarding this exception..."></textarea>
              </div>
            </div>

            <div class="group/toggle flex items-center justify-between p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/20">
              <div>
                <span class="block text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Optional Execution</span>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Allow personnel to override this exception</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.isOptional" class="sr-only peer">
                <div class="w-14 h-8 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div class="px-12 py-10 bg-slate-50/50 dark:bg-white/[0.01] flex justify-end gap-6 items-center border-t border-slate-100 dark:border-white/5">
            <button (click)="showModal = false; cdr.markForCheck()" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Abort</button>
            <button (click)="saveHoliday()" class="px-14 py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.4em] shadow-4xl hover:scale-105 active:scale-95 transition-all">
              {{ editingId ? 'Re-Commit Delta' : 'Initialize Exception' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HolidaysComponent implements OnInit {
  holidays: Holiday[] = [];
  showModal = false;
  editingId: number | null = null;
  form: Partial<Holiday> = { isOptional: false };

  constructor(private api: ApiService, public authService: AuthService, public cdr: ChangeDetectorRef) { }

  trackByHolidayId(index: number, h: Holiday): number { return h.id; }

  ngOnInit() { this.loadHolidays(); }

  loadHolidays() {
    this.api.getHolidays().subscribe(data => {
      this.holidays = data;
      this.cdr.markForCheck();
    });
  }

  openModal() { this.editingId = null; this.form = { isOptional: false }; this.showModal = true; }

  editHoliday(h: Holiday) { this.editingId = h.id; this.form = { ...h }; this.showModal = true; }

  saveHoliday() {
    const obs = this.editingId
      ? this.api.updateHoliday(this.editingId, this.form)
      : this.api.createHoliday(this.form);
    obs.subscribe(() => { this.showModal = false; this.loadHolidays(); });
  }

  deleteHoliday(id: number) {
    if (confirm('Delete this holiday?')) {
      this.api.deleteHoliday(id).subscribe(() => this.loadHolidays());
    }
  }
}
