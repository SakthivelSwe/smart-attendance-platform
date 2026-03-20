import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Employee, Group, Team } from '../../core/models/interfaces';

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
        <!-- BUG-006 fix: MANAGER+ can add/import employees -->
        <div class="flex items-center gap-3" *ngIf="authService.isManager">
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".csv" class="hidden">
          <button (click)="fileInput.click()" class="btn-secondary flex items-center gap-2">
            <span class="material-icons text-[18px]">publish</span>
            Import CSV
          </button>
          <button (click)="openModal()" class="btn-primary">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Employee
            </span>
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
        <div class="relative w-full sm:w-80">
           <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] material-icons text-sm">search</span>
           <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" placeholder="Search employees..." 
                  class="input-field pl-10"/>
        </div>
        
        <div class="text-sm text-[var(--text-secondary)] font-semibold font-sans">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredEmployees.length) }} of {{ filteredEmployees.length }}
        </div>
      </div>

      <!-- Skeleton Loaders -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="card p-4">
           <div class="flex items-center gap-4 mb-5">
              <div class="w-12 h-12 rounded-xl skeleton shrink-0"></div>
              <div class="space-y-2 flex-1">
                 <div class="h-4 skeleton rounded-lg w-3/4"></div>
                 <div class="h-3 skeleton rounded-lg w-1/3"></div>
              </div>
           </div>
           <div class="space-y-3">
              <div class="h-3 skeleton rounded-lg w-full"></div>
              <div class="h-3 skeleton rounded-lg w-5/6"></div>
              <div class="h-3 skeleton rounded-lg w-4/6"></div>
           </div>
           <div class="mt-4 pt-3 border-t border-[var(--border-color)] flex justify-end gap-2">
              <div class="w-8 h-8 rounded-lg skeleton"></div>
              <div class="w-8 h-8 rounded-lg skeleton"></div>
           </div>
        </div>
      </div>

      <!-- Employee cards grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div *ngFor="let emp of paginatedEmployees; let i = index" 
             class="card p-4 relative group hover:-translate-y-1 transition-all duration-300 animate-slide-up"
             [style.animation-delay]="i * 50 + 'ms'">
          
          <!-- Status Dot -->
           <span [class]="emp.isActive ? 'bg-emerald-500' : 'bg-rose-500'"
                 class="absolute top-4 right-4 w-2.5 h-2.5 rounded-full ring-4 ring-[var(--card-bg)]"
                 [title]="emp.isActive ? 'Active' : 'Inactive'">
           </span>

          <!-- Header (Compact) -->
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-200/60 dark:border-primary-800/40 flex items-center justify-center shrink-0">
               <span class="text-xl font-sans font-bold text-primary-600 dark:text-primary-400">
                 {{ emp.name.charAt(0) }}
               </span>
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-bold text-[var(--text-primary)] truncate font-sans" [title]="emp.name">{{ emp.name }}</h3>
              <p class="text-xs text-[var(--text-tertiary)] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-md inline-block mt-1">
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

            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400" *ngIf="emp.teamName">
               <span class="material-icons text-base text-indigo-500">business</span>
              <span class="truncate">{{ emp.teamName }}</span>
            </div>

            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400" *ngIf="emp.designation">
               <span class="material-icons text-base text-purple-500">badge</span>
              <span class="truncate">{{ emp.designation }}</span>
            </div>
          </div>

          <!-- Actions (Icon only) -->
          <!-- BUG-006 fix: MANAGER+ can edit/delete employees -->
          <div *ngIf="authService.isManager" class="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
            <button (click)="editEmployee(emp)" 
                    class="p-2 rounded-xl text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-all hover:scale-105" title="Edit">
               <span class="material-icons text-lg">edit</span>
            </button>
            <button (click)="deleteEmployee(emp.id)" 
                    class="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 transition-all hover:scale-105" title="Delete">
               <span class="material-icons text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex justify-center mt-8 gap-1.5" *ngIf="totalPages > 1">
        <button (click)="setPage(currentPage - 1)" [disabled]="currentPage === 1"
                class="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-tertiary)] transition-all">
          <span class="material-icons text-sm">chevron_left</span>
        </button>
        
        <button *ngFor="let page of visiblePages" 
                (click)="setPage(page)"
                class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all font-sans"
                [ngClass]="currentPage === page ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/20' : 'bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'">
          {{ page }}
        </button>

        <button (click)="setPage(currentPage + 1)" [disabled]="currentPage === totalPages"
                class="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-tertiary)] transition-all">
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
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="modal-container max-w-lg p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">{{ editingId ? 'Edit' : 'Add' }} Employee</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Name *</label>
                <input type="text" [(ngModel)]="form.name" class="input-field" placeholder="Full name"/>
              </div>
              <div>
                <label class="form-label">Code *</label>
                <input type="text" [(ngModel)]="form.employeeCode" class="input-field" placeholder="EMP001"/>
              </div>
            </div>
            <div>
              <label class="form-label">Email *</label>
              <input type="email" [(ngModel)]="form.email" class="input-field" placeholder="email@example.com"/>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Phone</label>
                <input type="text" [(ngModel)]="form.phone" class="input-field" placeholder="+91 9876543210"/>
              </div>
              <div>
                <label class="form-label">WhatsApp Name</label>
                <input type="text" [(ngModel)]="form.whatsappName" class="input-field" placeholder="Name in group"/>
              </div>
            </div>
            <div>
              <label class="form-label">Group</label>
              <select [(ngModel)]="form.groupId" class="input-field">
                <option [ngValue]="null">No Group</option>
                <option *ngFor="let g of groups" [ngValue]="g.id">{{ g.name }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Team</label>
                <select [(ngModel)]="form.teamId" class="input-field">
                  <option [ngValue]="null">No Team</option>
                  <option *ngFor="let t of teams" [ngValue]="t.id">{{ t.name }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">Designation</label>
                <input type="text" [(ngModel)]="form.designation" class="input-field" placeholder="Software Engineer"/>
              </div>
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
  teams: Team[] = [];
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
    this.api.getActiveTeams().subscribe(t => this.teams = t);
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (confirm(`Import employees from ${file.name}?`)) {
        this.api.importEmployees(file).subscribe({
          next: (res) => {
            alert(res);
            this.loadEmployees();
          },
          error: (err) => alert('Import failed: ' + err.message)
        });
      }
    }
    event.target.value = null; // reset
  }
}
