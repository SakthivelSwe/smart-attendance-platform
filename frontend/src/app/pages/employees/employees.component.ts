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

      <!-- Search & Filters -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-surface-50 dark:bg-surface-900/30 p-4 rounded-2xl border border-surface-200 dark:border-surface-700">
        <div class="relative w-full sm:w-80">
           <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 material-icons text-sm">search</span>
           <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" placeholder="Search employees..." 
                  class="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-sm"/>
        </div>
        
        <div class="text-sm text-surface-500 font-medium">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredEmployees.length) }} of {{ filteredEmployees.length }}
        </div>
      </div>

      <!-- Skeleton Loaders -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="glass-card p-4 animate-pulse bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm">
           <div class="flex items-center gap-4 mb-5">
              <div class="w-12 h-12 rounded-xl bg-surface-200 dark:bg-surface-800 shrink-0"></div>
              <div class="space-y-2 flex-1">
                 <div class="h-4 bg-surface-200 dark:bg-surface-800 rounded w-3/4"></div>
                 <div class="h-3 bg-surface-200 dark:bg-surface-800 rounded w-1/3"></div>
              </div>
           </div>
           <div class="space-y-3">
              <div class="h-3 bg-surface-200 dark:bg-surface-800 rounded w-full"></div>
              <div class="h-3 bg-surface-200 dark:bg-surface-800 rounded w-5/6"></div>
              <div class="h-3 bg-surface-200 dark:bg-surface-800 rounded w-4/6"></div>
           </div>
           <div class="mt-4 pt-3 border-t border-surface-100 dark:border-surface-800 flex justify-end gap-2">
              <div class="w-8 h-8 rounded-lg bg-surface-200 dark:bg-surface-800"></div>
              <div class="w-8 h-8 rounded-lg bg-surface-200 dark:bg-surface-800"></div>
           </div>
        </div>
      </div>

      <!-- Employee cards grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div *ngFor="let emp of paginatedEmployees; let i = index" 
             class="glass-card p-4 relative group hover:-translate-y-1 transition-all duration-300 animate-slide-up bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md"
             [style.animation-delay]="i * 50 + 'ms'">
          
          <!-- Status Dot -->
           <span [class]="emp.isActive ? 'bg-emerald-500' : 'bg-red-500'"
                 class="absolute top-4 right-4 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-surface-900"
                 [title]="emp.isActive ? 'Active' : 'Inactive'">
           </span>

          <!-- Header (Compact) -->
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 flex items-center justify-center shrink-0">
               <span class="text-xl font-sans font-semibold text-primary-600 dark:text-primary-400">
                 {{ emp.name.charAt(0) }}
               </span>
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-bold text-[var(--text-primary)] truncate" [title]="emp.name">{{ emp.name }}</h3>
              <p class="text-xs text-surface-500 font-mono bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded inline-block mt-1">
                {{ emp.employeeCode }}
              </p>
            </div>
          </div>

          <!-- Compact Details -->
          <div class="space-y-2 mb-4 text-sm">
            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400" [title]="emp.email">
              <span class="material-icons text-base text-surface-400">email</span>
              <span class="truncate">{{ emp.email }}</span>
            </div>

            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400" *ngIf="emp.phone">
               <span class="material-icons text-base text-surface-400">phone</span>
              <span class="truncate">{{ emp.phone }}</span>
            </div>

            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400" *ngIf="emp.whatsappName">
               <span class="material-icons text-base text-green-500">chat</span>
              <span class="truncate">{{ emp.whatsappName }}</span>
            </div>
            
             <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400" *ngIf="emp.groupName">
               <span class="material-icons text-base text-amber-500">group</span>
              <span class="truncate">{{ emp.groupName }}</span>
            </div>
          </div>

          <!-- Actions (Icon only) -->
          <div *ngIf="authService.isAdmin" class="flex justify-end gap-2 pt-3 border-t border-surface-100 dark:border-surface-800">
            <button (click)="editEmployee(emp)" 
                    class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors" title="Edit">
               <span class="material-icons text-lg">edit</span>
            </button>
            <button (click)="deleteEmployee(emp.id)" 
                    class="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" title="Delete">
               <span class="material-icons text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex justify-center mt-8 gap-2" *ngIf="totalPages > 1">
        <button (click)="setPage(currentPage - 1)" [disabled]="currentPage === 1"
                class="btn-secondary px-3 py-1 flex items-center disabled:opacity-50">
          <span class="material-icons text-sm">chevron_left</span>
        </button>
        
        <button *ngFor="let page of visiblePages" 
                (click)="setPage(page)"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                [class.bg-primary-600]="currentPage === page"
                [class.text-white]="currentPage === page"
                [class.hover:bg-surface-200]="currentPage !== page"
                [class.dark:hover:bg-surface-700]="currentPage !== page">
          {{ page }}
        </button>

        <button (click)="setPage(currentPage + 1)" [disabled]="currentPage === totalPages"
                class="btn-secondary px-3 py-1 flex items-center disabled:opacity-50">
          <span class="material-icons text-sm">chevron_right</span>
        </button>
      </div>

      <div *ngIf="!isLoading && filteredEmployees.length === 0" class="text-center py-12 text-[var(--text-secondary)]">
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
  isLoading = true;
  searchTerm = '';
  showModal = false;
  editingId: number | null = null;
  form: Partial<Employee> = {};

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  Math = Math; // for template usage

  constructor(private api: ApiService, public authService: AuthService) { }

  ngOnInit() {
    this.loadEmployees();
    this.api.getGroups().subscribe(g => this.groups = g);
  }

  loadEmployees() {
    this.isLoading = true;
    this.api.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
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

  get paginatedEmployees() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredEmployees.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
  }

  get visiblePages() {
    const pages = [];
    const total = this.totalPages;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
