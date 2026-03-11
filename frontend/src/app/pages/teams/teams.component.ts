import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Team, UserInfo } from '../../core/models/interfaces';

@Component({
  selector: 'app-teams',
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
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 dark:text-primary-400">Personnel Architecture</span>
          </div>
          <h1 class="text-5xl font-black text-slate-900 dark:text-white font-manrope tracking-tighter leading-none mb-4">
            Strategic <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">Forces</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-bold max-w-xl leading-relaxed tracking-tight">Managing human resource clusters and leadership hierarchy for rapid tactical deployment.</p>
        </div>
        
        <div class="flex items-center gap-4">
          <button *ngIf="authService.isManager" (click)="openModal()" 
                  class="group flex items-center gap-4 px-10 py-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500">
            <span class="material-icons text-xl group-hover:rotate-180 transition-transform duration-700">security</span>
            <span class="text-[10px] font-black uppercase tracking-[0.3em]">Initialize Force</span>
          </button>
        </div>
      </div>

      <!-- Tactical Search Matrix -->
      <div class="glass-card p-2 border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-4xl rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl">
        <div class="flex flex-col md:flex-row items-center gap-2">
          <div class="relative flex-1 group w-full">
            <span class="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 material-icons group-focus-within:text-primary-500 transition-colors">travel_explore</span>
            <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange()" placeholder="Omni search teams, leads, or tactical codes..." 
                   class="w-full pl-20 pr-10 py-6 rounded-[2rem] bg-transparent border-0 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all text-sm font-black text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:uppercase placeholder:tracking-widest"/>
          </div>
          <div class="flex items-center gap-4 px-10 py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shrink-0 shadow-2xl">
            <span class="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Force Count</span>
            <span class="text-xl font-black font-manrope leading-none">{{ filteredTeams.length }}</span>
          </div>
        </div>
      </div>

      <!-- Inventory Matrix: Strategic Nodes -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <!-- Skeleton Infrastructure -->
        <ng-container *ngIf="isLoading">
          <div *ngFor="let i of [1,2,3]" class="glass-card p-12 animate-pulse rounded-[3rem] border-0 ring-1 ring-slate-50 dark:ring-white/5 shadow-2xl">
             <div class="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-t-full mb-8"></div>
             <div class="space-y-6">
                <div class="h-8 bg-slate-100 dark:bg-white/5 rounded-full w-3/4"></div>
                <div class="h-4 bg-slate-50 dark:bg-white/[0.02] rounded-full w-1/2"></div>
                <div class="h-24 bg-slate-50 dark:bg-white/[0.02] rounded-[2rem] w-full"></div>
             </div>
          </div>
        </ng-container>

        <!-- Strategic Force Cards -->
        <div *ngFor="let team of filteredTeams; trackBy: trackByTeamId; let i = index"
             class="glass-card group p-0 overflow-hidden border-slate-100 dark:border-white/5 hover:border-primary-500/20 shadow-xl hover:shadow-4xl transition-all duration-700 animate-slide-up transform hover:-translate-y-3 rounded-[3.5rem]"
             [style.animation-delay]="i * 100 + 'ms'">
          
          <div class="h-3 w-full" [ngClass]="getTeamColor(i)"></div>
          
          <div class="p-12">
            <!-- Strategic Header -->
            <div class="flex items-start justify-between mb-10">
              <div class="min-w-0">
                <h3 class="text-3xl font-black text-slate-900 dark:text-white font-manrope tracking-tighter leading-none mb-3 truncate group-hover:text-primary-600 transition-colors" [title]="team.name">{{ team.name }}</h3>
                <div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 group-hover:bg-primary-500 transition-all group-hover:border-primary-400">
                  <span class="text-[9px] font-black font-mono text-primary-500 group-hover:text-white uppercase tracking-widest">{{ team.teamCode || 'CORE-NODE' }}</span>
                </div>
              </div>
              
              <div class="relative">
                <div class="absolute inset-0 blur-xl opacity-20 transition-all group-hover:opacity-40" [ngClass]="team.isActive ? 'bg-emerald-500' : 'bg-rose-500'"></div>
                <div [class]="team.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'"
                      class="w-10 h-10 rounded-2xl border flex items-center justify-center shadow-inner relative z-10 transition-all">
                  <span class="material-icons text-xl" [class.animate-pulse]="team.isActive">{{ team.isActive ? 'bolt' : 'power_off' }}</span>
                </div>
              </div>
            </div>

            <p *ngIf="team.description" class="text-xs font-bold text-slate-400 mb-10 line-clamp-3 leading-relaxed tracking-tight group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{{ team.description }}</p>

            <!-- Command Node Cluster -->
            <div class="space-y-4 mb-10">
              <div class="flex items-center gap-5 p-5 rounded-[2rem] bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 group/node transition-all group-hover:bg-white dark:group-hover:bg-white/5" *ngIf="team.teamLeadName">
                <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover/node:rotate-12 transition-transform shadow-inner">
                  <span class="material-icons text-2xl">person_pin</span>
                </div>
                <div class="min-w-0">
                  <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Force Commander</p>
                  <p class="text-sm font-black text-slate-900 dark:text-white truncate font-manrope">{{ team.teamLeadName }}</p>
                </div>
              </div>

              <div class="flex items-center gap-5 p-5 rounded-[2rem] bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 group/node transition-all group-hover:bg-white dark:group-hover:bg-white/5" *ngIf="team.managerName">
                <div class="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600 group-hover/node:rotate-12 transition-transform shadow-inner">
                  <span class="material-icons text-2xl">admin_panel_settings</span>
                </div>
                <div class="min-w-0">
                  <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Sector Manager</p>
                  <p class="text-sm font-black text-slate-900 dark:text-white truncate font-manrope">{{ team.managerName }}</p>
                </div>
              </div>
            </div>

            <!-- Force Logistics Registry -->
            <div class="flex items-center justify-between pt-10 border-t border-slate-100 dark:border-white/5">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 shadow-inner group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all">
                  <span class="material-icons">architecture</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xl font-black text-slate-900 dark:text-white leading-none tabular-nums">{{ team.employeeCount || 0 }}</span>
                  <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Active Nodes</span>
                </div>
              </div>

              <div *ngIf="authService.isManager" class="flex gap-4">
                <button (click)="editTeam(team)" 
                        class="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-600 shadow-xl border border-slate-100 dark:border-white/5 transition-all transform active:scale-90 flex items-center justify-center">
                  <span class="material-icons text-xl">tune</span>
                </button>
                <button (click)="deleteTeam(team.id)" 
                        class="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 shadow-xl border border-slate-100 dark:border-white/5 transition-all transform active:scale-90 flex items-center justify-center">
                  <span class="material-icons text-xl">delete_sweep</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Null Reality State -->
      <div *ngIf="!isLoading && filteredTeams.length === 0" 
           class="min-h-[500px] flex flex-col items-center justify-center p-20 text-center animate-fade-in group">
        <div class="relative mb-12 w-32 h-32 flex items-center justify-center">
          <div class="absolute inset-0 bg-primary-500/10 rounded-[3rem] animate-pulse scale-125"></div>
          <span class="material-icons text-7xl text-slate-200 dark:text-white/5 relative z-10 group-hover:scale-110 transition-transform duration-700">security_update_warning</span>
        </div>
        <h3 class="text-3xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Strategic Forces</h3>
        <p class="text-[10px] font-bold text-slate-400 mt-6 max-w-sm uppercase tracking-widest leading-loose">The organizational nexus identifies no topological forces in the current sector.</p>
        <button (click)="openModal()" class="mt-12 px-10 py-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-xl">Initialize First Force</button>
      </div>

      <!-- Strategic Force Configuration Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-fade-in">
        <div class="glass-card w-full max-w-2xl p-0 overflow-hidden ring-1 ring-white/10 shadow-5xl animate-zoom-in border-0 rounded-[3.5rem] bg-white dark:bg-slate-950">
          <div class="px-12 py-12 bg-slate-900 dark:bg-black text-white relative">
            <h3 class="text-3xl font-black font-manrope tracking-tight leading-none mb-2">{{ editingId ? 'Refine Force' : 'Deploy Force' }}</h3>
            <p class="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Strategic Force Configuration Matrix</p>
            <button (click)="showModal = false; cdr.markForCheck()" class="absolute top-12 right-12 text-white/40 hover:text-white transition-colors">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="p-12 space-y-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Force Designation</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">groups</span>
                  <input type="text" [(ngModel)]="form.name" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="Force Name">
                </div>
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Tactical Ident Code</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">terminal</span>
                  <input type="text" [(ngModel)]="form.teamCode" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all uppercase" placeholder="e.g. ALPHA-1">
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Operational Directive</label>
              <div class="relative">
                <span class="absolute left-6 top-6 text-primary-500 material-icons">description</span>
                <textarea [(ngModel)]="form.description" rows="3" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all resize-none" placeholder="Define force mission scope..."></textarea>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Force Commander</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">person_pin</span>
                  <select [(ngModel)]="form.teamLeadId" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-10 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all appearance-none cursor-pointer">
                    <option [ngValue]="null">Select Commander</option>
                    <option *ngFor="let u of availableLeads; trackBy: trackByUserId" [ngValue]="u.id">{{ u.name }}</option>
                  </select>
                </div>
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Sector Manager</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">admin_panel_settings</span>
                  <select [(ngModel)]="form.managerId" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-10 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all appearance-none cursor-pointer">
                    <option [ngValue]="null">Select Manager</option>
                    <option *ngFor="let u of availableManagers; trackBy: trackByUserId" [ngValue]="u.id">{{ u.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Synergy Email Alias</label>
              <div class="relative">
                <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">alternate_email</span>
                <input type="email" [(ngModel)]="form.emailAlias" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="force@org-hub.com">
              </div>
            </div>
          </div>

          <div class="px-12 py-10 bg-slate-50/50 dark:bg-white/[0.01] flex justify-end gap-6 items-center border-t border-slate-100 dark:border-white/5">
            <button (click)="showModal = false; cdr.markForCheck()" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Abort</button>
            <button (click)="saveTeam()" class="px-14 py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.4em] shadow-4xl hover:scale-105 active:scale-95 transition-all">
              {{ editingId ? 'Re-Commit Delta' : 'Initialize Force' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(var(--color-primary-500-rgb), 0.1); 
      border-radius: 20px;
    }
  `]
})
export class TeamsComponent implements OnInit {
  teams: Team[] = [];
  users: UserInfo[] = [];
  isLoading = true;
  searchTerm = '';
  showModal = false;
  editingId: number | null = null;
  form: Partial<Team> = {};

  constructor(private api: ApiService, public authService: AuthService, public cdr: ChangeDetectorRef) { }

  trackByTeamId(index: number, team: Team): number { return team.id; }
  trackByUserId(index: number, user: UserInfo): number | undefined { return user.id; }

  ngOnInit() {
    this.loadTeams();
    // BUG-003 fix: MANAGER+ need user list to assign leads/managers
    if (this.authService.isManager) {
      this.api.getUsers().subscribe({
        next: (u) => {
          this.users = u;
          this.cdr.markForCheck();
        }
      });
    }
  }

  loadTeams() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.api.getTeams().subscribe({
      next: (data) => { this.teams = data; this.isLoading = false; this.cdr.markForCheck(); },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  onSearchChange() {
    this.cdr.markForCheck();
  }

  get filteredTeams(): Team[] {
    if (!this.searchTerm) return this.teams;
    const s = this.searchTerm.toLowerCase();
    return this.teams.filter(t =>
      t.name.toLowerCase().includes(s) ||
      t.teamCode?.toLowerCase().includes(s) ||
      t.teamLeadName?.toLowerCase().includes(s) ||
      t.managerName?.toLowerCase().includes(s)
    );
  }

  get availableLeads(): UserInfo[] {
    return this.users.filter(u => u.role === 'TEAM_LEAD' || u.role === 'ADMIN' || u.role === 'MANAGER');
  }

  get availableManagers(): UserInfo[] {
    return this.users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
  }

  getTeamColor(index: number): string {
    const colors = [
      'bg-gradient-to-r from-indigo-500 to-blue-500',
      'bg-gradient-to-r from-emerald-500 to-teal-500',
      'bg-gradient-to-r from-amber-500 to-orange-500',
      'bg-gradient-to-r from-purple-500 to-pink-500',
      'bg-gradient-to-r from-rose-500 to-red-500',
      'bg-gradient-to-r from-cyan-500 to-blue-500',
    ];
    return colors[index % colors.length];
  }

  openModal() {
    this.editingId = null;
    this.form = {};
    this.showModal = true;
    this.cdr.markForCheck();
  }

  editTeam(team: Team) {
    this.editingId = team.id;
    this.form = { ...team };
    this.showModal = true;
    this.cdr.markForCheck();
  }

  saveTeam() {
    const obs = this.editingId
      ? this.api.updateTeam(this.editingId, this.form)
      : this.api.createTeam(this.form);
    obs.subscribe({
      next: () => { this.showModal = false; this.loadTeams(); this.cdr.markForCheck(); }
    });
  }

  deleteTeam(id: number) {
    if (confirm('Are you sure you want to deactivate this team?')) {
      this.api.deleteTeam(id).subscribe(() => this.loadTeams());
    }
  }
}
