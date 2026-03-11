import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Team, UserInfo } from '../../core/models/interfaces';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header">Teams</h1>
          <p class="page-subtitle">Manage organizational teams and their leads</p>
        </div>
        <!-- BUG-003 fix: MANAGER+ can create teams -->
        <button *ngIf="authService.isManager" (click)="openModal()" class="btn-primary">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Create Team
          </span>
        </button>
      </div>

      <!-- Search -->
      <div class="flex items-center justify-between gap-4 mb-6 bg-surface-50 dark:bg-surface-900/30 p-4 rounded-2xl border border-surface-200 dark:border-surface-700">
        <div class="relative w-full sm:w-80">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 material-icons text-sm">search</span>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search teams..." 
                 class="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-sm"/>
        </div>
        <div class="text-sm text-surface-500 font-medium">
          {{ filteredTeams.length }} team{{ filteredTeams.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Skeleton Loaders -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let i of [1,2,3]" class="glass-card p-5 animate-pulse bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm rounded-2xl">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl bg-surface-200 dark:bg-surface-800"></div>
            <div class="space-y-2 flex-1">
              <div class="h-4 bg-surface-200 dark:bg-surface-800 rounded w-3/4"></div>
              <div class="h-3 bg-surface-200 dark:bg-surface-800 rounded w-1/3"></div>
            </div>
          </div>
          <div class="space-y-3">
            <div class="h-3 bg-surface-200 dark:bg-surface-800 rounded w-full"></div>
            <div class="h-3 bg-surface-200 dark:bg-surface-800 rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <!-- Teams Grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let team of filteredTeams; let i = index"
             class="glass-card relative group hover:-translate-y-1 transition-all duration-300 animate-slide-up bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-lg rounded-2xl overflow-hidden"
             [style.animation-delay]="i * 60 + 'ms'">
          
          <!-- Team Header with gradient -->
          <div class="h-2 w-full" [ngClass]="getTeamColor(i)"></div>
          
          <div class="p-5">
            <!-- Name + Code -->
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-[var(--text-primary)]">{{ team.name }}</h3>
                <span *ngIf="team.teamCode" class="text-xs font-mono bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-surface-500 mt-1 inline-block">
                  {{ team.teamCode }}
                </span>
              </div>
              <span [class]="team.isActive ? 'bg-emerald-500' : 'bg-red-500'"
                    class="w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-surface-900"
                    [title]="team.isActive ? 'Active' : 'Inactive'">
              </span>
            </div>

            <!-- Description -->
            <p *ngIf="team.description" class="text-sm text-surface-500 mb-4 line-clamp-2">{{ team.description }}</p>

            <!-- Team Lead & Manager -->
            <div class="space-y-3 mb-4">
              <div class="flex items-center gap-3" *ngIf="team.teamLeadName">
                <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span class="material-icons text-blue-500 text-sm">person</span>
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-surface-400 uppercase tracking-wider font-medium">Team Lead</p>
                  <p class="text-sm font-semibold text-[var(--text-primary)] truncate">{{ team.teamLeadName }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3" *ngIf="team.managerName">
                <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span class="material-icons text-amber-500 text-sm">supervisor_account</span>
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-surface-400 uppercase tracking-wider font-medium">Manager</p>
                  <p class="text-sm font-semibold text-[var(--text-primary)] truncate">{{ team.managerName }}</p>
                </div>
              </div>
            </div>

            <!-- Footer: Employee count + Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
              <div class="flex items-center gap-2 text-sm">
                <span class="material-icons text-base text-surface-400">people</span>
                <span class="font-semibold text-[var(--text-primary)]">{{ team.employeeCount }}</span>
                <span class="text-surface-400">members</span>
              </div>
              <!-- BUG-003 fix: MANAGER+ can edit/delete teams -->
              <div *ngIf="authService.isManager" class="flex gap-1">
                <button (click)="editTeam(team)" 
                        class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors" title="Edit">
                  <span class="material-icons text-lg">edit</span>
                </button>
                <button (click)="deleteTeam(team.id)" 
                        class="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" title="Deactivate">
                  <span class="material-icons text-lg">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && filteredTeams.length === 0" class="text-center py-16 text-[var(--text-secondary)]">
        <svg class="w-16 h-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        <p class="font-medium mb-1">No teams found</p>
        <p class="text-sm">Create your first team to get started</p>
      </div>

      <!-- Create/Edit Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slide-up">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">{{ editingId ? 'Edit' : 'Create' }} Team</h3>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Team Name *</label>
                <input type="text" [(ngModel)]="form.name" class="input-field" placeholder="Java Team"/>
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Team Code</label>
                <input type="text" [(ngModel)]="form.teamCode" class="input-field" placeholder="JAVA"/>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
              <input type="text" [(ngModel)]="form.description" class="input-field" placeholder="Team description..."/>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Team Lead</label>
                <select [(ngModel)]="form.teamLeadId" class="input-field">
                  <option [ngValue]="null">None</option>
                  <option *ngFor="let u of availableLeads" [ngValue]="u.id">{{ u.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Manager</label>
                <select [(ngModel)]="form.managerId" class="input-field">
                  <option [ngValue]="null">None</option>
                  <option *ngFor="let u of availableManagers" [ngValue]="u.id">{{ u.name }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Alias</label>
              <input type="email" [(ngModel)]="form.emailAlias" class="input-field" placeholder="java-team@company.com"/>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button (click)="showModal = false" class="btn-secondary">Cancel</button>
            <button (click)="saveTeam()" class="btn-primary">{{ editingId ? 'Update' : 'Create' }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TeamsComponent implements OnInit {
  teams: Team[] = [];
  users: UserInfo[] = [];
  isLoading = true;
  searchTerm = '';
  showModal = false;
  editingId: number | null = null;
  form: Partial<Team> = {};

  constructor(private api: ApiService, public authService: AuthService) { }

  ngOnInit() {
    this.loadTeams();
    // BUG-003 fix: MANAGER+ need user list to assign leads/managers
    if (this.authService.isManager) {
      this.api.getAssignableUsers().subscribe(u => this.users = u);
    }
  }

  loadTeams() {
    this.isLoading = true;
    this.api.getTeams().subscribe({
      next: (data) => { this.teams = data; this.isLoading = false; },
      error: () => this.isLoading = false
    });
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
  }

  editTeam(team: Team) {
    this.editingId = team.id;
    this.form = { ...team };
    this.showModal = true;
  }

  saveTeam() {
    const obs = this.editingId
      ? this.api.updateTeam(this.editingId, this.form)
      : this.api.createTeam(this.form);
    obs.subscribe({
      next: () => { this.showModal = false; this.loadTeams(); }
    });
  }

  deleteTeam(id: number) {
    if (confirm('Are you sure you want to deactivate this team?')) {
      this.api.deleteTeam(id).subscribe(() => this.loadTeams());
    }
  }
}
