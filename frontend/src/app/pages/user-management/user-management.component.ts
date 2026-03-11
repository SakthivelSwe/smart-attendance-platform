import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { UserInfo, UserRole } from '../../core/models/interfaces';

@Component({
  selector: 'app-user-management',
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
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 dark:text-primary-400">Security Architecture</span>
          </div>
          <h1 class="text-5xl font-black text-slate-900 dark:text-white font-manrope tracking-tighter leading-none mb-4">
            Access <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">Registry</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-bold max-w-xl leading-relaxed tracking-tight">Managing neural identity propagation and hierarchical authorization across the unified organizational mesh.</p>
        </div>
        
        <!-- Tactical Role Selector Matrix -->
        <div class="flex flex-wrap items-center gap-3 p-2 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-inner">
          <button *ngFor="let role of roleOptions"
                  (click)="selectedRole = role.value; cdr.markForCheck()"
                  class="px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500"
                  [ngClass]="selectedRole === role.value 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-105' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'">
            {{ role.label }}
            <span class="ml-2 opacity-40">[{{ getRoleCount(role.value) }}]</span>
          </button>
        </div>
      </div>

      <!-- Tactical Search Matrix -->
      <div class="glass-card p-2 border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-4xl rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl">
        <div class="flex flex-col md:flex-row items-center gap-2">
          <div class="relative flex-1 group w-full">
            <span class="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 material-icons group-focus-within:text-primary-500 transition-colors">fingerprint</span>
            <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="cdr.markForCheck()" placeholder="Omni search users, emails, or tactical IDs..." 
                   class="w-full pl-20 pr-10 py-6 rounded-[2rem] bg-transparent border-0 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all text-sm font-black text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:uppercase placeholder:tracking-widest"/>
          </div>
          <div class="flex items-center gap-4 px-10 py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shrink-0 shadow-2xl">
            <span class="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Identity Nexus</span>
            <span class="text-xl font-black font-manrope leading-none">{{ filteredUsers.length }}</span>
          </div>
        </div>
      </div>

      <!-- Inventory Matrix: Identity Nodes -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <!-- Skeleton Infrastructure -->
        <ng-container *ngIf="isLoading">
          <div *ngFor="let i of [1,2,3,4,5,6]" class="glass-card p-8 animate-pulse rounded-[2.5rem] border-0 ring-1 ring-slate-50 dark:ring-white/5 shadow-2xl">
            <div class="flex items-center gap-6 mb-8">
              <div class="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5"></div>
              <div class="flex-1 space-y-3">
                <div class="h-4 bg-slate-100 dark:bg-white/5 rounded-full w-2/3"></div>
                <div class="h-2 bg-slate-50 dark:bg-white/[0.02] rounded-full w-1/2"></div>
              </div>
            </div>
            <div class="h-10 bg-slate-100 dark:bg-white/5 rounded-[1.5rem] w-full"></div>
          </div>
        </ng-container>

        <!-- Neural Identity Nodes -->
        <div *ngFor="let user of filteredUsers; trackBy: trackByUserId; let i = index" 
             class="glass-card group p-0 overflow-hidden border-slate-100 dark:border-white/5 hover:border-primary-500/20 shadow-xl hover:shadow-4xl transition-all duration-700 animate-slide-up transform hover:-translate-y-3 rounded-[3rem]"
             [style.animation-delay]="i * 50 + 'ms'">
          
          <div class="p-8">
            <div class="flex items-center gap-6 mb-8">
              <div class="relative">
                <div class="absolute inset-0 bg-primary-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name + '&background=6366f1&color=fff&size=80'"
                     class="w-16 h-16 rounded-[1.8rem] shadow-2xl relative z-10 border-2 border-white dark:border-slate-800 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3" [alt]="user.name"/>
                <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl border-2 border-white dark:border-slate-800 flex items-center justify-center z-20 shadow-lg"
                     [ngClass]="user.isActive ? 'bg-emerald-500' : 'bg-rose-500'">
                  <span class="material-icons text-white text-[12px]">{{ user.isActive ? 'check' : 'close' }}</span>
                </div>
              </div>
              <div class="min-w-0">
                <h3 class="text-lg font-black text-slate-900 dark:text-white font-manrope tracking-tighter truncate group-hover:text-primary-600 transition-colors">{{ user.name }}</h3>
                <p class="text-[10px] font-bold text-slate-400 truncate">{{ user.email }}</p>
              </div>
            </div>

            <!-- Tactical Configuration Matrix -->
            <div class="space-y-4 mb-8">
              <div class="flex flex-col gap-2">
                <label class="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Authorization Tier</label>
                <div class="relative group/select">
                  <select [ngModel]="user.role" (ngModelChange)="changeRole(user, $event)"
                          class="w-full text-[10px] font-black uppercase tracking-widest px-6 py-4 rounded-2xl border-0 shadow-inner bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-primary-500/10 transition-all"
                          [ngClass]="getRoleClasses(user.role)">
                    <option value="ADMIN">Tactical Admin</option>
                    <option value="MANAGER">Sector Manager</option>
                    <option value="TEAM_LEAD">Force Commander</option>
                    <option value="USER">Standard Node</option>
                  </select>
                  <span class="absolute right-6 top-1/2 -translate-y-1/2 material-icons text-sm pointer-events-none transition-transform group-hover/select:translate-y-1">expand_more</span>
                </div>
              </div>
            </div>

            <!-- Identity Delta Actions -->
            <div class="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
              <div class="flex items-center gap-2">
                <div [class]="user.emailVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 text-slate-400'"
                     class="w-8 h-8 rounded-xl flex items-center justify-center" [title]="user.emailVerified ? 'Verified Identity' : 'Unverified'">
                  <span class="material-icons text-sm">{{ user.emailVerified ? 'verified' : 'history_toggle_off' }}</span>
                </div>
                <span class="text-[9px] font-black uppercase tracking-[0.2em]" [ngClass]="user.isActive ? 'text-emerald-500' : 'text-rose-500'">
                  {{ user.isActive ? 'Live' : 'Locked' }}
                </span>
              </div>

              <div class="flex gap-2">
                <button (click)="toggleStatus(user)"
                        class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-90"
                        [ngClass]="user.isActive 
                          ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white' 
                          : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white'"
                        [title]="user.isActive ? 'Deactivate Node' : 'Activate Node'">
                  <span class="material-icons text-lg">{{ user.isActive ? 'lock' : 'lock_open' }}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="h-1.5 w-full bg-slate-100 dark:bg-white/5">
            <div class="h-full transform transition-transform duration-1000 origin-left scale-x-0 group-hover:scale-x-100 bg-primary-500"></div>
          </div>
        </div>
      </div>

      <!-- Null Reality State -->
      <div *ngIf="!isLoading && filteredUsers.length === 0" 
           class="min-h-[500px] flex flex-col items-center justify-center p-20 text-center animate-fade-in group">
        <div class="relative mb-12 w-32 h-32 flex items-center justify-center">
          <div class="absolute inset-0 bg-primary-500/10 rounded-[3rem] animate-pulse scale-125"></div>
          <span class="material-icons text-7xl text-slate-200 dark:text-white/5 relative z-10 group-hover:scale-110 transition-transform duration-700">person_search</span>
        </div>
        <h3 class="text-3xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Identities Found</h3>
        <p class="text-[10px] font-bold text-slate-400 mt-6 max-w-sm uppercase tracking-widest leading-loose">The identity nexus identifies no neural patterns matching the current search query.</p>
        <button (click)="searchTerm = ''; selectedRole = 'ALL'; cdr.markForCheck()" class="mt-12 px-10 py-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-xl">Reset Neural Search</button>
      </div>

      <!-- Strategic Role Reconfiguration Modal -->
      <div *ngIf="showConfirmModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-fade-in">
        <div class="glass-card w-full max-w-md p-0 overflow-hidden ring-1 ring-white/10 shadow-5xl animate-zoom-in border-0 rounded-[3.5rem] bg-white dark:bg-slate-950 text-center">
          <div class="px-12 py-12 bg-slate-900 dark:bg-black text-white relative">
            <div class="w-20 h-20 rounded-[2rem] bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-6">
              <span class="material-icons text-4xl">admin_panel_settings</span>
            </div>
            <h3 class="text-2xl font-black font-manrope tracking-tight leading-none mb-2">Reconfigure Authorization</h3>
            <p class="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Propagating privilege delta</p>
          </div>
          
          <div class="p-12 space-y-8">
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed tracking-tight">
              Change <span class="text-slate-900 dark:text-white">{{ pendingChange?.user?.name }}</span>'s hierarchical status from 
              <span class="text-primary-500">{{ formatRole(pendingChange?.user?.role) }}</span> to 
              <span class="text-primary-600">{{ formatRole(pendingChange?.newRole) }}</span>?
            </p>
            
            <div class="flex flex-col gap-4">
              <button (click)="confirmRoleChange()" class="w-full py-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.4em] shadow-4xl hover:scale-105 active:scale-95 transition-all">Execute Reconfiguration</button>
              <button (click)="cancelRoleChange()" class="w-full py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Abort Mission</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
    users: UserInfo[] = [];
    isLoading = true;
    searchTerm = '';
    selectedRole: string = 'ALL';

    showConfirmModal = false;
    pendingChange: { user: UserInfo; newRole: UserRole } | null = null;

    roleOptions = [
        { label: 'All', value: 'ALL' },
        { label: 'Admins', value: 'ADMIN' },
        { label: 'Managers', value: 'MANAGER' },
        { label: 'Team Leads', value: 'TEAM_LEAD' },
        { label: 'Employees', value: 'USER' },
    ];

    constructor(private api: ApiService, public authService: AuthService, public cdr: ChangeDetectorRef) { }

    trackByUserId(index: number, user: UserInfo): number | undefined { return user.id; }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.isLoading = true;
        this.cdr.markForCheck();
        this.api.getUsers().subscribe({
            next: (data) => { 
                this.users = data; 
                this.isLoading = false; 
                this.cdr.markForCheck();
            },
            error: () => { 
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    get filteredUsers(): UserInfo[] {
        let result = this.users;

        if (this.selectedRole !== 'ALL') {
            result = result.filter(u => u.role === this.selectedRole);
        }

        if (this.searchTerm) {
            const s = this.searchTerm.toLowerCase();
            result = result.filter(u =>
                u.name.toLowerCase().includes(s) ||
                u.email.toLowerCase().includes(s)
            );
        }

        return result;
    }

    getRoleCount(role: string): number {
        if (role === 'ALL') return this.users.length;
        return this.users.filter(u => u.role === role).length;
    }

    getRoleClasses(role: string): string {
        switch (role) {
            case 'ADMIN': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'MANAGER': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'TEAM_LEAD': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            default: return 'bg-surface-50 text-surface-600 border-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700';
        }
    }

    formatRole(role?: string): string {
        switch (role) {
            case 'ADMIN': return 'Admin';
            case 'MANAGER': return 'Manager';
            case 'TEAM_LEAD': return 'Team Lead';
            case 'USER': return 'Employee';
            default: return role || '';
        }
    }

    changeRole(user: UserInfo, newRole: UserRole) {
        if (newRole === user.role) return;
        this.pendingChange = { user, newRole };
        this.showConfirmModal = true;
        this.cdr.markForCheck();
    }

    confirmRoleChange() {
        if (!this.pendingChange) return;
        const { user, newRole } = this.pendingChange;
        this.api.updateUserRole(user.id, newRole).subscribe({
            next: (updated) => {
                const idx = this.users.findIndex(u => u.id === updated.id);
                if (idx >= 0) this.users[idx] = updated;
                this.showConfirmModal = false;
                this.pendingChange = null;
                this.cdr.markForCheck();
            }
        });
    }

    cancelRoleChange() {
        this.showConfirmModal = false;
        this.pendingChange = null;
        this.cdr.markForCheck();
        // Reload to reset the dropdown back to original
        this.loadUsers();
    }

    toggleStatus(user: UserInfo) {
        const action = user.isActive ? 'deactivate' : 'activate';
        if (confirm(`Are you sure you want to ${action} ${user.name}?`)) {
            this.api.updateUserStatus(user.id, !user.isActive).subscribe({
                next: (updated) => {
                    const idx = this.users.findIndex(u => u.id === updated.id);
                    if (idx >= 0) this.users[idx] = updated;
                    this.cdr.markForCheck();
                }
            });
        }
    }
}
