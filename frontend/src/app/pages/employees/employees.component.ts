import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Employee, Group } from '../../core/models/interfaces';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header">Employees</h1>
          <p class="page-subtitle">Manage employee records and WhatsApp name mappings</p>
        </div>
        <button *ngIf="authService.isAdmin" (click)="openModal()" class="btn-primary">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Employee
          </span>
        </button>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <input type="text" [(ngModel)]="searchTerm" placeholder="Search by name, email, code..." class="input-field max-w-md"/>
      </div>

      <!-- Employee cards grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let emp of filteredEmployees" class="card p-5 hover:shadow-card-hover">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                  {{ emp.name.charAt(0) }}
                </div>
              </div>
              <div>
                <p class="font-semibold text-[var(--text-primary)]">{{ emp.name }}</p>
                <p class="text-xs text-[var(--text-secondary)]">{{ emp.employeeCode }}</p>
              </div>
            </div>
            <span *ngIf="emp.isActive" class="badge-approved">Active</span>
            <span *ngIf="!emp.isActive" class="badge-absent">Inactive</span>

          <div class="space-y-2 text-sm text-[var(--text-secondary)]">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span class="truncate">{{ emp.email }}</span>
            </div>
            <div class="flex items-center gap-2" *ngIf="emp.whatsappName">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span>{{ emp.whatsappName }}</span>
            </div>
            <div class="flex items-center gap-2" *ngIf="emp.groupName">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              <span>{{ emp.groupName }}</span>
            </div>
          </div>

          <div *ngIf="authService.isAdmin" class="flex gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
            <button (click)="editEmployee(emp)" class="flex-1 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition">Edit</button>
            <button (click)="deleteEmployee(emp.id)" class="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">Delete</button>
          </div>
        </div>
      </div>

      <div *ngIf="filteredEmployees.length === 0" class="text-center py-12 text-[var(--text-secondary)]">
        <svg class="w-16 h-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <p>No employees found</p>
      </div>

      <!-- Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slide-up">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">{{ editingId ? 'Edit' : 'Add' }} Employee</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name *</label>
                <input type="text" [(ngModel)]="form.name" class="input-field" placeholder="Full name"/>
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Code *</label>
                <input type="text" [(ngModel)]="form.employeeCode" class="input-field" placeholder="EMP001"/>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email *</label>
              <input type="email" [(ngModel)]="form.email" class="input-field" placeholder="email@example.com"/>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone</label>
                <input type="text" [(ngModel)]="form.phone" class="input-field" placeholder="+91 9876543210"/>
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">WhatsApp Name</label>
                <input type="text" [(ngModel)]="form.whatsappName" class="input-field" placeholder="Name in group"/>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Group</label>
              <select [(ngModel)]="form.groupId" class="input-field">
                <option [ngValue]="null">No Group</option>
                <option *ngFor="let g of groups" [ngValue]="g.id">{{ g.name }}</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="showModal = false" class="btn-secondary">Cancel</button>
            <button (click)="saveEmployee()" class="btn-primary">{{ editingId ? 'Update' : 'Create' }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  groups: Group[] = [];
  searchTerm = '';
  showModal = false;
  editingId: number | null = null;
  form: Partial<Employee> = {};

  constructor(private api: ApiService, public authService: AuthService) { }

  ngOnInit() {
    this.loadEmployees();
    this.api.getGroups().subscribe(g => this.groups = g);
  }

  loadEmployees() {
    this.api.getEmployees().subscribe(data => this.employees = data);
  }

  get filteredEmployees() {
    if (!this.searchTerm) return this.employees;
    const s = this.searchTerm.toLowerCase();
    return this.employees.filter(e =>
      e.name.toLowerCase().includes(s) ||
      e.email.toLowerCase().includes(s) ||
      e.employeeCode?.toLowerCase().includes(s)
    );
  }

  openModal() {
    this.editingId = null;
    this.form = {};
    this.showModal = true;
  }

  editEmployee(emp: Employee) {
    this.editingId = emp.id;
    this.form = { ...emp };
    this.showModal = true;
  }

  saveEmployee() {
    const obs = this.editingId
      ? this.api.updateEmployee(this.editingId, this.form)
      : this.api.createEmployee(this.form);
    obs.subscribe({ next: () => { this.showModal = false; this.loadEmployees(); } });
  }

  deleteEmployee(id: number) {
    if (confirm('Are you sure you want to deactivate this employee?')) {
      this.api.deleteEmployee(id).subscribe(() => this.loadEmployees());
    }
  }
}
