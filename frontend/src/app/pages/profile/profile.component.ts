import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
      <div class="mb-8">
        <h1 class="page-header">My Profile</h1>
        <p class="page-subtitle">Manage your personal information and preferences</p>
      </div>

      <!-- Skeleton Loading -->
      <div *ngIf="isLoading" class="max-w-3xl mx-auto">
        <div class="card p-0 overflow-hidden">
          <div class="h-28 skeleton rounded-none"></div>
          <div class="px-6 pb-8 pt-2">
            <div class="flex items-end gap-4 -mt-12 mb-6">
              <div class="w-20 h-20 rounded-2xl skeleton ring-4 ring-[var(--card-bg)]"></div>
              <div class="space-y-2 flex-1 pt-8">
                <div class="h-5 skeleton rounded-lg w-1/3"></div>
                <div class="h-3 skeleton rounded-lg w-1/4"></div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="h-14 skeleton rounded-xl"></div>
              <div class="h-14 skeleton rounded-xl"></div>
              <div class="h-14 skeleton rounded-xl"></div>
              <div class="h-14 skeleton rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading && profile" class="max-w-3xl mx-auto space-y-6">
        <!-- Profile Header Card -->
        <div class="card relative overflow-hidden">
          <div class="h-28 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 relative">
            <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2720%27%20height%3D%2720%27%20viewBox%3D%270%200%2020%2020%27%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%3E%3Ccircle%20cx%3D%271%27%20cy%3D%271%27%20r%3D%271%27%20fill%3D%27rgba(255%2C255%2C255%2C0.05)%27/%3E%3C/svg%3E')]"></div>
          </div>
          <div class="px-6 pb-6">
            <div class="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
              <img [src]="profile.avatarUrl || 'https://ui-avatars.com/api/?name=' + profile.name + '&background=1d43f1&color=fff&size=80&bold=true'"
                   class="w-20 h-20 rounded-2xl ring-4 ring-[var(--card-bg)] shadow-elevated object-cover" [alt]="profile.name"/>
              <div class="flex-1 pt-2">
                <h2 class="text-xl font-extrabold text-[var(--text-primary)] font-sans tracking-tight">{{ profile.name }}</h2>
                <p class="text-sm text-[var(--text-secondary)] flex items-center gap-2 mt-0.5 font-body">
                  <span class="w-2 h-2 rounded-full" [ngClass]="getRoleBadgeColor()"></span>
                  {{ formatRole() }}
                  <span *ngIf="profile.teamName" class="text-surface-300 dark:text-surface-600">·</span>
                  <span *ngIf="profile.teamName" class="font-medium">{{ profile.teamName }}</span>
                </p>
              </div>
              <button *ngIf="!isEditing" (click)="isEditing = true; editForm = {name: profile.name, phone: profile.phone}"
                      class="btn-secondary text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <!-- Info Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Personal Info -->
          <div class="card p-6">
            <h3 class="text-xs font-extrabold uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-5 font-sans">Personal Information</h3>
            <div class="space-y-5">
              <div>
                <label class="form-label mb-1">Full Name</label>
                <p *ngIf="!isEditing" class="text-sm font-semibold text-[var(--text-primary)] font-body">{{ profile.name }}</p>
                <input *ngIf="isEditing" type="text" [(ngModel)]="editForm.name" class="input-field"/>
              </div>
              <div>
                <label class="form-label mb-1">Email</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 font-body">
                  {{ profile.email }}
                  <span class="text-emerald-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </span>
                </p>
              </div>
              <div>
                <label class="form-label mb-1">Phone</label>
                <p *ngIf="!isEditing" class="text-sm font-semibold text-[var(--text-primary)] font-body">{{ profile.phone || 'Not set' }}</p>
                <input *ngIf="isEditing" type="text" [(ngModel)]="editForm.phone" class="input-field"/>
              </div>
              <div>
                <label class="form-label mb-1">Employee Code</label>
                <p class="text-sm font-mono font-bold text-[var(--text-primary)]">{{ profile.employeeCode || 'Not assigned' }}</p>
              </div>
            </div>
          </div>

          <!-- Organization Info -->
          <div class="card p-6">
            <h3 class="text-xs font-extrabold uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-5 font-sans">Organization</h3>
            <div class="space-y-5">
              <div>
                <label class="form-label mb-1">Role</label>
                <p class="mt-1">
                  <span class="px-3 py-1.5 rounded-lg text-xs font-bold" [ngClass]="getRoleClasses()">{{ formatRole() }}</span>
                </p>
              </div>
              <div>
                <label class="form-label mb-1">Team</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] font-body">{{ profile.teamName || 'No team assigned' }}</p>
              </div>
              <div>
                <label class="form-label mb-1">Designation</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] font-body">{{ profile.designation || 'Not set' }}</p>
              </div>
              <div *ngIf="profile.teamLeadName">
                <label class="form-label mb-1">Team Lead</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] font-body">{{ profile.teamLeadName }}</p>
              </div>
              <div *ngIf="profile.managerName">
                <label class="form-label mb-1">Manager</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] font-body">{{ profile.managerName }}</p>
              </div>
              <div *ngIf="profile.groupName">
                <label class="form-label mb-1">Group</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] font-body">{{ profile.groupName }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Actions -->
        <div *ngIf="isEditing" class="flex justify-end gap-3">
          <button (click)="cancelEdit()" class="btn-secondary">Cancel</button>
          <button (click)="saveProfile()" class="btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
    profile: any = null;
    isLoading = true;
    isEditing = false;
    editForm: any = {};

    constructor(private api: ApiService, public authService: AuthService) { }

    ngOnInit() {
        const userId = this.authService.currentUser?.userId;
        if (userId) {
            this.api.getProfile(userId).subscribe({
                next: (data) => { this.profile = data; this.isLoading = false; },
                error: () => this.isLoading = false
            });
        }
    }

    formatRole(): string {
        switch (this.profile?.role) {
            case 'ADMIN': return 'Administrator';
            case 'MANAGER': return 'Manager';
            case 'TEAM_LEAD': return 'Team Lead';
            case 'USER': return 'Employee';
            default: return this.profile?.role || '';
        }
    }

    getRoleBadgeColor(): string {
        switch (this.profile?.role) {
            case 'ADMIN': return 'bg-rose-500';
            case 'MANAGER': return 'bg-amber-500';
            case 'TEAM_LEAD': return 'bg-sky-500';
            default: return 'bg-emerald-500';
        }
    }

    getRoleClasses(): string {
        switch (this.profile?.role) {
            case 'ADMIN': return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40';
            case 'MANAGER': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40';
            case 'TEAM_LEAD': return 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40';
            default: return 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300 border border-surface-200/60 dark:border-surface-700/40';
        }
    }

    cancelEdit() {
        this.isEditing = false;
        this.editForm = {};
    }

    saveProfile() {
        const userId = this.authService.currentUser?.userId;
        if (!userId) return;
        this.api.updateProfile(userId, this.editForm).subscribe({
            next: (data) => {
                this.profile = data;
                this.isEditing = false;
                this.editForm = {};
            }
        });
    }
}
