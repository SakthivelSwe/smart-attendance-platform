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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div *ngFor="let emp of filteredEmployees; let i = index" 
             class="glass-card p-6 relative group hover:-translate-y-2 transition-all duration-300 animate-slide-up"
             [style.animation-delay]="i * 50 + 'ms'">
          
          <!-- Status Badge -->
           <span [class]="emp.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'"
                 class="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md z-10">
             {{ emp.isActive ? 'Active' : 'Inactive' }}
           </span>

          <!-- Header -->
          <div class="flex flex-col items-center text-center mb-6 relative">
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-indigo-600 p-0.5 shadow-lg shadow-primary-500/20 mb-4 group-hover:scale-105 transition-transform duration-300">
               <div class="w-full h-full bg-white dark:bg-surface-800 rounded-xl flex items-center justify-center overflow-hidden">
                  <span class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary-600 to-indigo-600">
                    {{ emp.name.charAt(0) }}
                  </span>
               </div>
            </div>
            <h3 class="text-lg font-bold text-[var(--text-primary)] mb-1">{{ emp.name }}</h3>
            <p class="text-sm text-primary-500 font-mono bg-primary-50 dark:bg-primary-900/10 px-2 py-0.5 rounded-md border border-primary-100 dark:border-primary-800/30">
              {{ emp.employeeCode }}
            </p>
          </div>

          <!-- Details -->
          <div class="space-y-3 mb-6">
            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <span class="text-sm text-[var(--text-secondary)] truncate flex-1" [title]="emp.email">{{ emp.email }}</span>
            </div>

            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" *ngIf="emp.phone">
               <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <span class="text-sm text-[var(--text-secondary)] truncate flex-1">{{ emp.phone }}</span>
            </div>

            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" *ngIf="emp.whatsappName">
               <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <span class="text-sm text-[var(--text-secondary)] truncate flex-1">{{ emp.whatsappName }}</span>
            </div>
            
             <div class="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" *ngIf="emp.groupName">
               <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <span class="text-sm text-[var(--text-secondary)] truncate flex-1">{{ emp.groupName }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div *ngIf="authService.isAdmin" class="grid grid-cols-2 gap-3 mt-auto">
            <button (click)="editEmployee(emp)" 
                    class="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
               </svg>
               Edit
            </button>
            <button (click)="deleteEmployee(emp.id)" 
                    class="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
               </svg>
               Delete
            </button>
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
