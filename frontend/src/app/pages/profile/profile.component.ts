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

      <div *ngIf="isLoading" class="max-w-3xl mx-auto">
        <div class="animate-pulse card p-8">
          <div class="flex items-center gap-6 mb-6">
            <div class="w-20 h-20 rounded-full bg-surface-200 dark:bg-surface-800"></div>
            <div class="space-y-3 flex-1">
              <div class="h-6 bg-surface-200 dark:bg-surface-800 rounded w-1/3"></div>
              <div class="h-4 bg-surface-200 dark:bg-surface-800 rounded w-1/4"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="h-12 bg-surface-200 dark:bg-surface-800 rounded-xl"></div>
            <div class="h-12 bg-surface-200 dark:bg-surface-800 rounded-xl"></div>
            <div class="h-12 bg-surface-200 dark:bg-surface-800 rounded-xl"></div>
            <div class="h-12 bg-surface-200 dark:bg-surface-800 rounded-xl"></div>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading && profile" class="max-w-3xl mx-auto space-y-6">
        <!-- Profile Header Card -->
        <div class="card relative overflow-hidden">
          <div class="h-24 bg-gradient-to-r from-primary-600 to-indigo-600"></div>
          <div class="px-6 pb-6">
            <div class="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
              <img [src]="profile.avatarUrl || 'https://ui-avatars.com/api/?name=' + profile.name + '&background=6366f1&color=fff&size=80'"
                   class="w-20 h-20 rounded-xl ring-4 ring-white dark:ring-surface-900 shadow-lg" [alt]="profile.name"/>
              <div class="flex-1 pt-2">
                <h2 class="text-xl font-bold text-[var(--text-primary)]">{{ profile.name }}</h2>
                <p class="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" [ngClass]="getRoleBadgeColor()"></span>
                  {{ formatRole() }}
                  <span *ngIf="profile.teamName" class="text-surface-300 dark:text-surface-600">|</span>
                  <span *ngIf="profile.teamName">{{ profile.teamName }}</span>
                </p>
              </div>
              <button *ngIf="!isEditing" (click)="isEditing = true" class="btn-secondary text-sm">
                <span class="material-icons text-sm mr-1">edit</span> Edit Profile
              </button>
            </div>
          </div>
        </div>

        <!-- Info Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Personal Info -->
          <div class="card p-6">
            <h3 class="text-sm font-bold uppercase tracking-wider text-surface-400 mb-4">Personal Information</h3>
            <div class="space-y-4">
              <div>
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Full Name</label>
                <p *ngIf="!isEditing" class="text-sm font-semibold text-[var(--text-primary)] mt-1">{{ profile.name }}</p>
                <input *ngIf="isEditing" type="text" [(ngModel)]="editForm.name" class="input-field mt-1"/>
              </div>
              <div>
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Email</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] mt-1 flex items-center gap-2">
                  {{ profile.email }}
                  <span class="material-icons text-sm text-emerald-500">verified</span>
                </p>
              </div>
              <div>
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Phone</label>
                <p *ngIf="!isEditing" class="text-sm font-semibold text-[var(--text-primary)] mt-1">{{ profile.phone || 'Not set' }}</p>
                <input *ngIf="isEditing" type="text" [(ngModel)]="editForm.phone" class="input-field mt-1"/>
              </div>
              <div>
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Employee Code</label>
                <p class="text-sm font-mono font-semibold text-[var(--text-primary)] mt-1">{{ profile.employeeCode || 'Not assigned' }}</p>
              </div>
            </div>
          </div>

          <!-- Organization Info -->
          <div class="card p-6">
            <h3 class="text-sm font-bold uppercase tracking-wider text-surface-400 mb-4">Organization</h3>
            <div class="space-y-4">
              <div>
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Role</label>
                <p class="mt-1">
                  <span class="px-3 py-1 rounded-lg text-xs font-bold" [ngClass]="getRoleClasses()">{{ formatRole() }}</span>
                </p>
              </div>
              <div>
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Team</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] mt-1">{{ profile.teamName || 'No team assigned' }}</p>
              </div>
              <div>
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Designation</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] mt-1">{{ profile.designation || 'Not set' }}</p>
              </div>
              <div *ngIf="profile.teamLeadName">
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Team Lead</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] mt-1">{{ profile.teamLeadName }}</p>
              </div>
              <div *ngIf="profile.managerName">
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Manager</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] mt-1">{{ profile.managerName }}</p>
              </div>
              <div *ngIf="profile.groupName">
                <label class="text-xs font-medium text-surface-400 uppercase tracking-wider">Group</label>
                <p class="text-sm font-semibold text-[var(--text-primary)] mt-1">{{ profile.groupName }}</p>
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
            case 'ADMIN': return 'bg-red-500';
            case 'MANAGER': return 'bg-amber-500';
            case 'TEAM_LEAD': return 'bg-blue-500';
            default: return 'bg-emerald-500';
        }
    }

    getRoleClasses(): string {
        switch (this.profile?.role) {
            case 'ADMIN': return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'MANAGER': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            case 'TEAM_LEAD': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300';
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
