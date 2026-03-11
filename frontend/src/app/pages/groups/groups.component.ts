import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Group } from '../../core/models/interfaces';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-20">
      <!-- High-Fidelity Header & Strategic Controls -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-slate-100 dark:border-white/5">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="w-12 h-1 bg-primary-600 rounded-full"></span>
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 dark:text-primary-400">Structural Architecture</span>
          </div>
          <h1 class="text-5xl font-black text-slate-900 dark:text-white font-manrope tracking-tighter leading-none mb-4">
            Organizational <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">Clusters</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-bold max-w-xl leading-relaxed tracking-tight">Structured intelligence reservoirs for WhatsApp synchronization and departmental routing.</p>
        </div>
        
        <div class="flex items-center gap-4">
          <button *ngIf="authService.isManager" (click)="openModal()" 
                  class="group flex items-center gap-4 px-10 py-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500">
            <span class="material-icons text-xl group-hover:rotate-180 transition-transform duration-700">add_moderator</span>
            <span class="text-[10px] font-black uppercase tracking-[0.3em]">Initialize Cluster</span>
          </button>
        </div>
      </div>

      <!-- Inventory Matrix: Neural Nodes -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <!-- Skeleton Infrastructure -->
        <ng-container *ngIf="isLoading">
          <div *ngFor="let i of [1,2,3]" class="glass-card p-12 animate-pulse rounded-[3rem] border-0 ring-1 ring-slate-50 dark:ring-white/5 shadow-2xl">
             <div class="flex items-center gap-8 mb-10">
                <div class="w-20 h-20 rounded-[2.5rem] bg-slate-100 dark:bg-white/5"></div>
                <div class="space-y-4 flex-1">
                   <div class="h-6 bg-slate-100 dark:bg-white/5 rounded-full w-3/4"></div>
                   <div class="h-3 bg-slate-50 dark:bg-white/[0.02] rounded-full w-1/2"></div>
                </div>
             </div>
             <div class="space-y-4">
                <div class="h-12 bg-slate-50 dark:bg-white/[0.02] rounded-2xl w-full"></div>
                <div class="h-12 bg-slate-50 dark:bg-white/[0.02] rounded-2xl w-full"></div>
             </div>
          </div>
        </ng-container>

        <!-- Neural Cluster Cards -->
        <div *ngFor="let g of groups; trackBy: trackByGroupId; let i = index" 
             class="glass-card group p-0 overflow-hidden border-slate-100 dark:border-white/5 hover:border-primary-500/20 shadow-xl hover:shadow-4xl transition-all duration-700 animate-slide-up transform hover:-translate-y-3 rounded-[3rem]"
             [style.animation-delay]="i * 100 + 'ms'">
          
          <!-- Cluster Identity Ribbon -->
          <div class="absolute top-10 right-10 flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all z-10"
               [ngClass]="g.isActive 
                ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10' 
                : 'bg-rose-500/5 text-rose-600 border-rose-500/10'">
            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="g.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"></span>
            {{ g.isActive ? 'Active synergy' : 'Offline' }}
          </div>

          <div class="p-12 pb-8">
            <div class="flex items-start gap-8 mb-10">
              <div class="relative">
                <div class="absolute inset-0 bg-primary-500/20 rounded-[2.5rem] blur-2xl group-hover:bg-primary-500/40 transition-all scale-150"></div>
                <div class="relative w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white font-black text-3xl shadow-3xl border border-white/10 group-hover:rotate-12 transition-all duration-700">
                  {{ g.name ? g.name.charAt(0) : '?' }}
                </div>
              </div>
              <div class="pt-2 min-w-0">
                <h3 class="text-2xl font-black text-slate-900 dark:text-white font-manrope tracking-tighter uppercase leading-none mb-3 group-hover:text-primary-600 transition-colors truncate" [title]="g.name">{{ g.name }}</h3>
                <div class="flex items-center gap-2.5">
                   <div class="flex -space-x-2">
                     <div *ngFor="let a of [1,2,3]" class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800"></div>
                   </div>
                   <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 border-l border-slate-100 dark:border-white/10">{{ g.employeeCount || 0 }} Personnel Nodes</span>
                </div>
              </div>
            </div>

            <div class="w-full space-y-5">
               <div class="flex items-center gap-5 p-5 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 transition-all group-hover:bg-white dark:group-hover:bg-white/5 group-hover:shadow-lg group-hover:shadow-slate-200/50 dark:group-hover:shadow-black/20" *ngIf="g.whatsappGroupName">
                 <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <span class="material-icons text-lg">hub</span>
                 </div>
                 <div class="min-w-0">
                   <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">WhatsApp Hub</p>
                   <p class="text-xs font-black text-slate-900 dark:text-white truncate font-manrope lowercase">{{ g.whatsappGroupName }}</p>
                 </div>
               </div>
               
               <div class="flex items-center gap-5 p-5 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 transition-all group-hover:bg-white dark:group-hover:bg-white/5 group-hover:shadow-lg group-hover:shadow-slate-200/50 dark:group-hover:shadow-black/20" *ngIf="g.emailSubjectPattern">
                 <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <span class="material-icons text-lg">terminal</span>
                 </div>
                 <div class="min-w-0">
                   <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Intelligence Vector Pattern</p>
                   <p class="text-xs font-black text-slate-900 dark:text-white font-mono opacity-80 uppercase">{{ g.emailSubjectPattern }}</p>
                 </div>
               </div>
            </div>
          </div>

          <!-- Cluster Strategic Actions -->
          <div class="px-12 py-10 bg-slate-50/80 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-6">
             <div class="flex flex-col">
               <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none uppercase">Encryption Vault</span>
               <span class="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono opacity-40">{{ (g.googleSheetId?.substring(0, 12) || 'NONE') + '...' }}</span>
             </div>
             
             <div class="flex items-center gap-4">
               <button (click)="editGroup(g)" *ngIf="authService.isManager"
                       class="p-5 rounded-[1.5rem] bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-600 shadow-xl border border-slate-100 dark:border-white/5 transition-all active:scale-90 flex items-center justify-center">
                 <span class="material-icons text-lg">tune</span>
               </button>
               <button (click)="deleteGroup(g.id)" *ngIf="authService.isManager"
                       class="p-5 rounded-[1.5rem] bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 shadow-xl border border-slate-100 dark:border-white/5 transition-all active:scale-90 flex items-center justify-center">
                 <span class="material-icons text-lg">delete_sweep</span>
               </button>
             </div>
          </div>
        </div>
      </div>

      <!-- Null Reality State -->
      <div *ngIf="!isLoading && groups.length === 0" class="min-h-[500px] flex flex-col items-center justify-center p-20 text-center animate-fade-in group">
        <div class="relative mb-12 w-32 h-32 flex items-center justify-center">
          <div class="absolute inset-0 bg-primary-500/10 rounded-[3rem] animate-pulse scale-125"></div>
          <span class="material-icons text-7xl text-slate-200 dark:text-white/5 relative z-10 group-hover:scale-110 transition-transform duration-700">hub</span>
        </div>
        <h3 class="text-3xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Clusters</h3>
        <p class="text-[10px] font-bold text-slate-400 mt-6 max-w-sm uppercase tracking-widest leading-loose">The organizational nexus identifies no topological nodes in the current registry.</p>
        <button (click)="openModal()" class="mt-12 px-10 py-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-xl">Initialize First Cluster</button>
      </div>

      <!-- Neural Cluster Calibration Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-fade-in">
        <div class="glass-card w-full max-w-2xl p-0 overflow-hidden ring-1 ring-white/10 shadow-5xl animate-zoom-in border-0 rounded-[3.5rem] bg-white dark:bg-slate-950">
          <div class="px-12 py-12 bg-slate-900 dark:bg-black text-white relative">
            <h3 class="text-3xl font-black font-manrope tracking-tight leading-none mb-2">{{ editingId ? 'Refine Cluster' : 'Initialize Cluster' }}</h3>
            <p class="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Neural Cluster Configuration Matrix</p>
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
                  <input type="text" [(ngModel)]="form.name" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="Department ID">
                </div>
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">WhatsApp Hub Root</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">hub</span>
                  <input type="text" [(ngModel)]="form.whatsappGroupName" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="Sync Hub Name">
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Intelligence Vector Pattern (Email Subject)</label>
              <div class="relative">
                <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">terminal</span>
                <input type="text" [(ngModel)]="form.emailSubjectPattern" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="e.g. REPORT-*">
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">G-Sheet Synchronization Vault ID</label>
              <div class="relative">
                <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">data_object</span>
                <input type="text" [(ngModel)]="form.googleSheetId" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="Google Spreadsheet Hash ID">
              </div>
            </div>
          </div>

          <div class="px-12 py-10 bg-slate-50/50 dark:bg-white/[0.01] flex justify-end gap-6 items-center border-t border-slate-100 dark:border-white/5">
            <button (click)="showModal = false; cdr.markForCheck()" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Abort</button>
            <button (click)="saveGroup()" class="px-14 py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.4em] shadow-4xl hover:scale-105 active:scale-95 transition-all">
              {{ editingId ? 'Re-Commit Delta' : 'Initialize Cluster' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GroupsComponent implements OnInit {
  groups: Group[] = [];
  isLoading = true;
  showModal = false;
  editingId: number | null = null;
  form: Partial<Group> = {};

  constructor(private api: ApiService, public authService: AuthService, public cdr: ChangeDetectorRef) { }

  trackByGroupId(index: number, group: Group): number {
    return group.id;
  }

  ngOnInit() { this.loadGroups(); }

  loadGroups() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.api.getGroups().subscribe({
      next: (data) => {
        this.groups = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openModal() { this.editingId = null; this.form = {}; this.showModal = true; this.cdr.markForCheck(); }

  editGroup(g: Group) { this.editingId = g.id; this.form = { ...g }; this.showModal = true; this.cdr.markForCheck(); }

  saveGroup() {
    const obs = this.editingId
      ? this.api.updateGroup(this.editingId, this.form)
      : this.api.createGroup(this.form);
    obs.subscribe(() => { this.showModal = false; this.loadGroups(); this.cdr.markForCheck(); });
  }

  deleteGroup(id: number) {
    if (confirm('Delete this group?')) {
      this.api.deleteGroup(id).subscribe(() => this.loadGroups());
    }
  }
}
