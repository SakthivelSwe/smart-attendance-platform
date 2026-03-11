import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Employee, Group, Team } from '../../core/models/interfaces';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-20">
      <!-- High-Fidelity Header & Strategic Intent -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-slate-100 dark:border-white/5">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="w-12 h-1 bg-primary-600 rounded-full"></span>
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 dark:text-primary-400">Structural Hierarchy</span>
          </div>
          <h1 class="text-5xl font-black text-slate-900 dark:text-white font-manrope tracking-tighter leading-none mb-4">
            Organizational <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">Architecture</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-bold max-w-xl leading-relaxed tracking-tight">Mapping the structural hierarchy and personnel distribution matrix across the unified organization.</p>
        </div>
        
        <div class="flex items-center gap-4">
          <button (click)="loadData()" 
                  class="group flex items-center gap-4 px-10 py-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500">
            <span class="material-icons text-xl group-hover:rotate-180 transition-transform duration-700">sync</span>
            <span class="text-[10px] font-black uppercase tracking-[0.3em]">Re-assemble Structure</span>
          </button>
        </div>
      </div>

      <!-- Loading State: Architectural Pulse -->
      <div *ngIf="isLoading" class="min-h-[400px] flex flex-col items-center justify-center space-y-6">
        <div class="relative w-20 h-20">
          <div class="absolute inset-0 rounded-3xl bg-primary-500/20 animate-ping"></div>
          <div class="absolute inset-4 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-2xl shadow-primary-500/50">
            <span class="material-icons text-3xl animate-pulse">account_tree</span>
          </div>
        </div>
        <p class="text-xs font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Syncing Structural Nodes...</p>
      </div>

      <!-- Structural Output: High-Fidelity Tree -->
      <div *ngIf="!isLoading && orgStructure.length > 0" class="space-y-20 relative">
        <!-- Connecting Vertical Spine -->
        <div class="absolute left-12 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-primary-500/20 to-transparent dark:from-white/10 dark:via-primary-400/10 dark:to-transparent"></div>

        <div *ngFor="let group of orgStructure; let gi = index; trackBy: trackByNodeId" 
             class="relative pl-12 animate-slide-up"
             [style.animation-delay]="gi * 100 + 'ms'">
          
          <!-- Structural Anchor Node -->
          <div class="absolute left-10 top-6 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-primary-500 shadow-lg shadow-primary-500/20 z-10"></div>

          <!-- Divisional Root Node -->
          <div class="glass-card p-8 border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-3xl inline-flex items-center gap-6 mb-12 transform hover:scale-[1.02] transition-transform">
             <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
               <span class="material-icons text-3xl">domain</span>
             </div>
             <div>
               <h2 class="text-2xl font-black text-slate-900 dark:text-white font-manrope tracking-tight">{{ group.name }}</h2>
               <div class="flex items-center gap-3 mt-2">
                 <span class="px-3 py-1 rounded-lg bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/5">{{ group.location || 'HQ Cluster' }}</span>
                 <span class="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10"></span>
                 <span class="text-[9px] font-black uppercase tracking-widest text-primary-500">{{ group.teams.length }} Active Clusters</span>
               </div>
             </div>
          </div>

          <!-- Dynamic Team Grid -->
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <div *ngFor="let team of group.teams; let ti = index; trackBy: trackByNodeId" 
                 class="glass-card p-0 overflow-hidden border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-2xl relative group/team animate-fade-in"
                 [style.animation-delay]="(gi * 100 + ti * 50) + 'ms'">
              
              <!-- Team Intensity Header -->
              <div class="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover/team:rotate-12 transition-transform">
                    <span class="material-icons text-xl">group_work</span>
                  </div>
                  <div>
                    <h3 class="text-sm font-black text-slate-900 dark:text-white tracking-tight">{{ team.name }}</h3>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tactical Deployment Team</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                   <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span class="text-[10px] font-black text-slate-600 dark:text-slate-300 tabular-nums">{{ team.members.length }} Nodes</span>
                </div>
              </div>

              <!-- Personnel Matrix: Scrollable Array -->
              <div class="p-6 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar bg-white/30 dark:bg-transparent">
                <div *ngFor="let emp of team.members; let ei = index; trackBy: trackByEmployeeId" 
                     class="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-50 dark:border-white/5 hover:border-primary-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group/emp transform hover:-translate-x-2">
                   
                   <div class="flex items-center gap-4">
                     <div class="relative">
                        <div class="w-12 h-12 rounded-[1.2rem] bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10 group-hover/emp:scale-110 transition-transform">
                          <span class="text-xs font-black font-manrope">{{ emp.name.charAt(0) }}</span>
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-500 shadow-sm"></div>
                     </div>
                     
                     <div class="flex flex-col">
                       <h4 class="text-xs font-black text-slate-900 dark:text-white tracking-tight">{{ emp.name }}</h4>
                       <div class="flex items-center gap-2 mt-1">
                          <span class="material-icons text-[10px] text-primary-500/60">engineering</span>
                          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{{ emp.designation || 'Specialist' }}</span>
                       </div>
                     </div>
                   </div>

                   <div class="flex flex-col items-end">
                      <span class="text-[10px] font-black text-slate-900 dark:text-white tabular-nums tracking-widest">{{ emp.employeeCode }}</span>
                      <span class="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Verified</span>
                   </div>
                </div>

                <!-- Null State: Node Vacancy -->
                <div *ngIf="team.members?.length === 0" class="py-12 flex flex-col items-center justify-center text-slate-300 dark:text-white/10">
                   <span class="material-icons text-4xl mb-3">person_add_disabled</span>
                   <p class="text-[10px] font-black uppercase tracking-widest">No Active Nodes Assigned</p>
                </div>
              </div>
              
              <!-- Tactical Footer Decoration -->
              <div class="h-1 w-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent opacity-0 group-hover/team:opacity-100 transition-opacity duration-700"></div>
            </div>
            
            <!-- Structural Connector Line -->
            <div *ngIf="group.teams.length === 0" class="col-span-1 xl:col-span-2 py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
               <span class="material-icons text-5xl text-slate-100 dark:text-white/5 mb-4">layers_clear</span>
               <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural cluster is currently devoid of deployment teams</p>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data: Architectural Void -->
      <div *ngIf="!isLoading && orgStructure.length === 0" class="min-h-[500px] flex flex-col items-center justify-center glass-card border-dashed">
         <span class="material-icons text-7xl text-slate-200 dark:text-white/5 mb-8">hub</span>
         <h2 class="text-xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Structure Nodes Detected</h2>
         <p class="text-xs font-bold text-slate-400 mt-4 max-w-sm text-center italic tracking-tight leading-relaxed">The organization schema currently contains no valid hierarchical mappings. Please re-assemble or check personnel master data.</p>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(var(--color-primary-500-rgb), 0.1); 
      border-radius: 20px;
    }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { 
       background: rgba(var(--color-primary-500-rgb), 0.3); 
    }
  `]
})
export class OrgChartComponent implements OnInit {
  isLoading = true;
  groups: Group[] = [];
  teams: Team[] = [];
  employees: Employee[] = [];

  orgStructure: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadData();
  }

  trackByNodeId(index: number, item: any): string {
    return item.id;
  }

  trackByEmployeeId(index: number, item: Employee): string {
    return item.employeeCode;
  }

  loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();
    forkJoin({
      groups: this.api.getGroups(),
      teams: this.api.getActiveTeams(),
      employees: this.api.getEmployees()
    }).subscribe({
      next: (data) => {
        this.groups = data.groups;
        this.teams = data.teams;
        this.employees = data.employees;
        this.buildStructure();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load org chart data', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  buildStructure() {
    // Top Level: Groups
    this.orgStructure = this.groups.map(group => {
      // Find teams in this group
      const currentTeams = this.teams.filter(t => t.groupId === group.id);

      const parsedTeams = currentTeams.map(team => {
        // Find employees in this team
        const currentEmployees = this.employees.filter(e => e.teamId === team.id && e.isActive);
        return {
          ...team,
          members: currentEmployees
        };
      });

      return {
        ...group,
        teams: parsedTeams
      };
    });

    // Handle Unassigned (No Group)
    const teamsWithNoGroup = this.teams.filter(t => !t.groupId);
    if (teamsWithNoGroup.length > 0) {
      const parsedUnassignedTeams = teamsWithNoGroup.map(team => {
        const currentEmployees = this.employees.filter(e => e.teamId === team.id && e.isActive);
        return { ...team, members: currentEmployees };
      });
      this.orgStructure.push({
        id: 'unassigned-group',
        name: 'Independent Teams',
        teams: parsedUnassignedTeams
      });
    }

    // Handle No Team Employees
    const empNoTeam = this.employees.filter(e => !e.teamId && e.isActive);
    if (empNoTeam.length > 0) {
      this.orgStructure.push({
        id: 'no-team',
        name: 'Unassigned Personnel',
        teams: [
          {
            id: 'no-team-wrapper',
            name: 'Direct Reports',
            members: empNoTeam
          }
        ]
      });
    }
  }
}
