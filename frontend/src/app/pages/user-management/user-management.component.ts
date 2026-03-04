import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { UserInfo, UserRole } from '../../core/models/interfaces';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header">User Management</h1>
          <p class="page-subtitle">Manage user accounts, roles, and access permissions</p>
        </div>
        <!-- Role filter pills -->
        <div class="flex flex-wrap gap-2">
          <button *ngFor="let role of roleOptions"
                  (click)="selectedRole = role.value"
                  class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all border"
                  [ngClass]="selectedRole === role.value 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                    : 'bg-white dark:bg-surface-800 text-surface-600 border-surface-200 dark:border-surface-700 hover:border-primary-300'">
            {{ role.label }}
            <span class="ml-1 px-1.5 py-0.5 text-[10px] rounded-full"
                  [ngClass]="selectedRole === role.value ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-700'">
              {{ getRoleCount(role.value) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="flex items-center gap-4 mb-6 bg-surface-50 dark:bg-surface-900/30 p-4 rounded-2xl border border-surface-200 dark:border-surface-700">
        <div class="relative w-full sm:w-80">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 material-icons text-sm">search</span>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search users..." 
                 class="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-sm"/>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="space-y-3">
        <div *ngFor="let i of [1,2,3,4,5]" class="animate-pulse bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-800"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-surface-200 dark:bg-surface-800 rounded w-1/3"></div>
            <div class="h-3 bg-surface-200 dark:bg-surface-800 rounded w-1/4"></div>
          </div>
          <div class="w-24 h-8 bg-surface-200 dark:bg-surface-800 rounded-lg"></div>
        </div>
      </div>

      <!-- Users Table -->
      <div *ngIf="!isLoading" class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                <th class="text-left px-5 py-3 font-semibold text-surface-500 uppercase text-xs tracking-wider">User</th>
                <th class="text-left px-5 py-3 font-semibold text-surface-500 uppercase text-xs tracking-wider">Email</th>
                <th class="text-left px-5 py-3 font-semibold text-surface-500 uppercase text-xs tracking-wider">Role</th>
                <th class="text-center px-5 py-3 font-semibold text-surface-500 uppercase text-xs tracking-wider">Status</th>
                <th class="text-center px-5 py-3 font-semibold text-surface-500 uppercase text-xs tracking-wider">Verified</th>
                <th class="text-right px-5 py-3 font-semibold text-surface-500 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers; let i = index" 
                  class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors animate-slide-up"
                  [style.animation-delay]="i * 30 + 'ms'">
                <!-- User avatar + name -->
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3">
                    <img [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name + '&background=6366f1&color=fff&size=40'"
                         class="w-9 h-9 rounded-full shadow-sm" [alt]="user.name"/>
                    <span class="font-semibold text-[var(--text-primary)]">{{ user.name }}</span>
                  </div>
                </td>

                <!-- Email -->
                <td class="px-5 py-3 text-surface-500">{{ user.email }}</td>

                <!-- Role dropdown -->
                <td class="px-5 py-3">
                  <select [ngModel]="user.role" (ngModelChange)="changeRole(user, $event)"
                          class="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer"
                          [ngClass]="getRoleClasses(user.role)">
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="TEAM_LEAD">Team Lead</option>
                    <option value="USER">Employee</option>
                  </select>
                </td>

                <!-- Status toggle -->
                <td class="px-5 py-3 text-center">
                  <button (click)="toggleStatus(user)" 
                          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all"
                          [ngClass]="user.isActive 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100' 
                            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100'">
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="user.isActive ? 'bg-emerald-500' : 'bg-red-500'"></span>
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </button>
                </td>

                <!-- Verified -->
                <td class="px-5 py-3 text-center">
                  <span class="material-icons text-lg" [ngClass]="user.emailVerified ? 'text-emerald-500' : 'text-surface-300'">
                    {{ user.emailVerified ? 'verified' : 'cancel' }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-5 py-3 text-right">
                  <button (click)="toggleStatus(user)"
                          class="p-1.5 rounded-lg transition-colors"
                          [ngClass]="user.isActive 
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' 
                            : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'"
                          [title]="user.isActive ? 'Deactivate' : 'Activate'">
                    <span class="material-icons text-lg">{{ user.isActive ? 'block' : 'check_circle' }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <div *ngIf="filteredUsers.length === 0" class="text-center py-12 text-[var(--text-secondary)]">
          <span class="material-icons text-4xl text-surface-300 dark:text-surface-600 mb-2 block">person_off</span>
          <p>No users match your filters</p>
        </div>
      </div>

      <!-- Role change confirmation modal -->
      <div *ngIf="showConfirmModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
          <div class="text-center mb-4">
            <span class="material-icons text-4xl text-amber-500 mb-2">admin_panel_settings</span>
            <h3 class="text-lg font-semibold text-[var(--text-primary)]">Change Role</h3>
          </div>
          <p class="text-sm text-center text-[var(--text-secondary)] mb-6">
            Change <strong>{{ pendingChange?.user?.name }}</strong>'s role from 
            <span class="font-semibold">{{ formatRole(pendingChange?.user?.role) }}</span> to 
            <span class="font-semibold">{{ formatRole(pendingChange?.newRole) }}</span>?
          </p>
          <div class="flex justify-center gap-3">
            <button (click)="cancelRoleChange()" class="btn-secondary">Cancel</button>
            <button (click)="confirmRoleChange()" class="btn-primary">Confirm</button>
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

    constructor(private api: ApiService, public authService: AuthService) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.isLoading = true;
        this.api.getUsers().subscribe({
            next: (data) => { this.users = data; this.isLoading = false; },
            error: () => this.isLoading = false
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
            }
        });
    }

    cancelRoleChange() {
        this.showConfirmModal = false;
        this.pendingChange = null;
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
                }
            });
        }
    }
}
