import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Holiday } from '../../core/models/interfaces';

@Component({
    selector: 'app-holidays',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header">Holidays</h1>
          <p class="page-subtitle">Manage company holidays and optional days</p>
        </div>
        <button *ngIf="authService.isAdmin" (click)="openModal()" class="btn-primary">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Holiday
          </span>
        </button>
      </div>

      <!-- Holiday list -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let h of holidays" class="card p-5 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full" [class.bg-purple-500]="!h.isOptional" [class.bg-amber-400]="h.isOptional"></div>
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-semibold text-[var(--text-primary)]">{{ h.name }}</p>
              <p class="text-sm text-[var(--text-secondary)]">{{ h.date }}</p>
            </div>
            <span *ngIf="h.isOptional" class="badge-pending">Optional</span>
            <span *ngIf="!h.isOptional" class="badge-holiday">Mandatory</span>
          </div>
          <p *ngIf="h.description" class="text-sm text-[var(--text-secondary)] mt-2">{{ h.description }}</p>

          <div *ngIf="authService.isAdmin" class="flex gap-2 mt-4 pt-3 border-t border-[var(--border-color)]">
            <button (click)="editHoliday(h)" class="flex-1 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition">Edit</button>
            <button (click)="deleteHoliday(h.id)" class="flex-1 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">Delete</button>
          </div>
        </div>
      </div>

      <div *ngIf="holidays.length === 0" class="text-center py-16 text-[var(--text-secondary)]">
        <p>No holidays configured</p>
      </div>

      <!-- Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">{{ editingId ? 'Edit' : 'Add' }} Holiday</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name *</label>
              <input type="text" [(ngModel)]="form.name" class="input-field" placeholder="Holiday name"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date *</label>
              <input type="date" [(ngModel)]="form.date" class="input-field"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
              <textarea [(ngModel)]="form.description" rows="3" class="input-field resize-none" placeholder="Optional description"></textarea>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="form.isOptional" class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"/>
              <span class="text-sm text-[var(--text-secondary)]">Optional Holiday</span>
            </label>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="showModal = false" class="btn-secondary">Cancel</button>
            <button (click)="saveHoliday()" class="btn-primary">{{ editingId ? 'Update' : 'Create' }}</button>
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

    constructor(private api: ApiService, public authService: AuthService) { }

    ngOnInit() { this.loadHolidays(); }

    loadHolidays() { this.api.getHolidays().subscribe(data => this.holidays = data); }

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
