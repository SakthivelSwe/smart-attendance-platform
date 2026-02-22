import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Group } from '../../core/models/interfaces';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header">Groups</h1>
          <p class="page-subtitle">Manage WhatsApp attendance groups</p>
        </div>
        <button *ngIf="authService.isAdmin" (click)="openModal()" class="btn-primary">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Group
          </span>
        </button>
      </div>

      <!-- Skeleton Loaders -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div *ngFor="let i of [1,2,3]" class="card p-5 animate-pulse">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-surface-200 dark:bg-surface-700"></div>
              <div class="space-y-2">
                <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24"></div>
                <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-16"></div>
              </div>
            </div>
            <div class="h-5 bg-surface-200 dark:bg-surface-700 rounded w-12"></div>
          </div>
          <div class="space-y-3 mb-4">
            <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-3/4"></div>
            <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2"></div>
          </div>
          <div class="flex gap-2 mt-4 pt-3 border-t border-[var(--border-color)]">
             <div class="flex-1 h-8 bg-surface-200 dark:bg-surface-700 rounded"></div>
             <div class="flex-1 h-8 bg-surface-200 dark:bg-surface-700 rounded"></div>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let g of groups" class="card p-5">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                {{ g.name.charAt(0) }}
              </div>
              <div>
                <p class="font-semibold text-[var(--text-primary)]">{{ g.name }}</p>
                <p class="text-xs text-[var(--text-secondary)]">{{ g.employeeCount }} employees</p>
              </div>
            </div>
            <span *ngIf="g.isActive" class="badge-approved">Active</span>
            <span *ngIf="!g.isActive" class="badge-absent">Inactive</span>
          </div>

          <div class="space-y-2 text-sm text-[var(--text-secondary)]">
            <div class="flex items-center gap-2" *ngIf="g.whatsappGroupName">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span class="truncate">{{ g.whatsappGroupName }}</span>
            </div>
            <div class="flex items-center gap-2" *ngIf="g.emailSubjectPattern">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span class="truncate">{{ g.emailSubjectPattern }}</span>
            </div>
          </div>

          <div *ngIf="authService.isAdmin" class="flex gap-2 mt-4 pt-3 border-t border-[var(--border-color)]">
            <button (click)="editGroup(g)" class="flex-1 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors">Edit</button>
            <button (click)="deleteGroup(g.id)" class="flex-1 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors">Delete</button>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading && groups.length === 0" class="text-center py-12 text-[var(--text-secondary)] bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700 mt-6">
        <svg class="w-16 h-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <p class="font-medium">No groups found</p>
        <p class="text-sm opacity-70 mt-1">Add a group to organize your team</p>
      </div>

      <!-- Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">{{ editingId ? 'Edit' : 'Add' }} Group</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name *</label>
              <input type="text" [(ngModel)]="form.name" class="input-field" placeholder="Group name"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">WhatsApp Group Name</label>
              <input type="text" [(ngModel)]="form.whatsappGroupName" class="input-field" placeholder="Exact name in WhatsApp"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Subject Pattern</label>
              <input type="text" [(ngModel)]="form.emailSubjectPattern" class="input-field" placeholder="e.g., WhatsApp Chat*"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Google Sheet ID</label>
              <input type="text" [(ngModel)]="form.googleSheetId" class="input-field" placeholder="Optional Sheet ID"/>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="showModal = false" class="btn-secondary">Cancel</button>
            <button (click)="saveGroup()" class="btn-primary">{{ editingId ? 'Update' : 'Create' }}</button>
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

  constructor(private api: ApiService, public authService: AuthService) { }

  ngOnInit() { this.loadGroups(); }

  loadGroups() {
    this.isLoading = true;
    this.api.getGroups().subscribe({
      next: (data) => {
        this.groups = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  openModal() { this.editingId = null; this.form = {}; this.showModal = true; }

  editGroup(g: Group) { this.editingId = g.id; this.form = { ...g }; this.showModal = true; }

  saveGroup() {
    const obs = this.editingId
      ? this.api.updateGroup(this.editingId, this.form)
      : this.api.createGroup(this.form);
    obs.subscribe(() => { this.showModal = false; this.loadGroups(); });
  }

  deleteGroup(id: number) {
    if (confirm('Delete this group?')) {
      this.api.deleteGroup(id).subscribe(() => this.loadGroups());
    }
  }
}
