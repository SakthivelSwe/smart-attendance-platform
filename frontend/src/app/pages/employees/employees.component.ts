import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Employee, Group, Team } from '../../core/models/interfaces';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 animate-fade-in pb-20">
      <!-- High-Fidelity Header & Strategic Controls -->
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-3">
            Personnel <span class="text-primary-600 dark:text-primary-400">Inventory</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Authoritative registry of corporate personnel nodes and structural associations</p>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20" *ngIf="authService.isManager">
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".csv" class="hidden">
          
          <button (click)="fileInput.click()" 
                  class="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 shadow-xl transition-all transform hover:-translate-y-1 active:scale-95">
            <span class="material-icons text-xl text-slate-400 group-hover:text-amber-500 transition-colors">cloud_upload</span>
            <span class="text-[10px] font-black uppercase tracking-[0.2em]">Import CSV</span>
          </button>
          
          <button (click)="openModal()" 
                  class="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/30 transition-all transform hover:-translate-y-1 active:scale-95">
            <span class="material-icons text-xl group-hover:rotate-90 transition-transform">person_add</span>
            <span class="text-[10px] font-black uppercase tracking-[0.2em]">Deploy Node</span>
          </button>
        </div>
      </div>

      <!-- Tactical Search & Meta Bar -->
      <div class="glass-card p-4 border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-4xl animate-zoom-in flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="relative w-full md:max-w-xl group">
          <div class="absolute inset-0 bg-primary-500/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-all"></div>
          <span class="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500 material-icons text-xl">manage_search</span>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1; onSearchChange()" 
                 placeholder="Search by Identity, Digital Address, or Personnel Code..." 
                 class="relative w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all"/>
        </div>
        
        <div class="flex items-center gap-4 px-8 py-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
           <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Temporal View</span>
           <span class="text-xs font-black text-slate-900 dark:text-white tabular-nums">
             {{ filteredEmployees.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0 }} – {{ Math.min(currentPage * itemsPerPage, filteredEmployees.length) }}
           </span>
           <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mx-1 opacity-40">of</span>
           <span class="text-xs font-black text-slate-900 dark:text-white tabular-nums">{{ filteredEmployees.length }} Nodes</span>
        </div>
      </div>

      <!-- Skeleton Loaders -->
      <!-- Inventory Matrix: High-Fidelity Nodes -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        <!-- Skeleton Infrastructure -->
        <ng-container *ngIf="isLoading">
          <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="glass-card p-10 animate-pulse rounded-[2.5rem] border-0 ring-1 ring-slate-50 dark:ring-white/5 shadow-2xl">
             <div class="flex flex-col items-center mb-10">
                <div class="w-24 h-24 rounded-[2.5rem] bg-slate-100 dark:bg-white/5 mb-6"></div>
                <div class="h-5 bg-slate-100 dark:bg-white/5 rounded-full w-48 mb-3"></div>
                <div class="h-3 bg-slate-50 dark:bg-white/[0.02] rounded-full w-24"></div>
             </div>
             <div class="space-y-4 px-4">
                <div class="h-10 bg-slate-50 dark:bg-white/[0.02] rounded-2xl w-full"></div>
                <div class="h-10 bg-slate-50 dark:bg-white/[0.02] rounded-2xl w-full"></div>
             </div>
          </div>
        </ng-container>

        <!-- Personnel Node Cards -->
        <div *ngFor="let emp of paginatedEmployees; trackBy: trackByEmployeeId; let i = index" 
             class="glass-card group p-0 overflow-hidden border-slate-100 dark:border-white/5 hover:border-primary-500/20 shadow-xl hover:shadow-4xl transition-all duration-500 animate-slide-up transform hover:-translate-y-2 rounded-[2.5rem]"
             [style.animation-delay]="i * 40 + 'ms'">
          
          <!-- Identity Status Ribbon -->
          <div class="absolute top-8 right-8 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all z-10"
               [ngClass]="emp.isActive 
                ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10' 
                : 'bg-rose-500/5 text-rose-600 border-rose-500/10'">
            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="emp.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"></span>
            {{ emp.isActive ? 'Active' : 'Dormant' }}
          </div>

          <div class="p-10 pb-6 flex flex-col items-center text-center">
            <div class="relative mb-8 pt-4">
              <div class="absolute inset-0 bg-primary-500/10 rounded-[2.5rem] blur-2xl group-hover:bg-primary-500/20 transition-all scale-150"></div>
              <div class="relative w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-3xl shadow-2xl border-4 border-white dark:border-slate-800 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                {{ emp.name ? emp.name.charAt(0) : '?' }}
              </div>
            </div>

            <h3 class="text-xl font-black text-slate-900 dark:text-white font-manrope tracking-tight uppercase leading-none mb-3 group-hover:text-primary-600 transition-colors truncate w-full px-4" [title]="emp.name">{{ emp.name }}</h3>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">{{ emp.designation || 'Specialist Node' }}</p>
            
            <div class="w-full space-y-4">
               <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 transition-all group-hover:bg-white dark:group-hover:bg-white/5">
                 <span class="material-icons text-primary-500 text-lg">fingerprint</span>
                 <div class="text-left">
                   <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Structural ID</p>
                   <p class="text-xs font-black text-slate-900 dark:text-white tabular-nums">{{ emp.employeeCode || 'VOID' }}</p>
                 </div>
               </div>
               
               <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 transition-all group-hover:bg-white dark:group-hover:bg-white/5">
                 <span class="material-icons text-primary-500 text-lg">hub</span>
                 <div class="text-left">
                   <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Node Collective</p>
                   <p class="text-xs font-black text-slate-900 dark:text-white truncate max-w-[150px]">{{ emp.groupName || 'No Group' }}</p>
                 </div>
               </div>
            </div>
          </div>

          <!-- Node Strategic Actions -->
          <div class="px-10 py-8 bg-slate-50/80 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
             <div class="flex flex-col">
               <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Status</span>
               <span class="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{{ emp.isActive ? 'Active' : 'Inactive' }}</span>
             </div>
             
             <div class="flex items-center gap-3">
               <button (click)="editEmployee(emp)" *ngIf="authService.isManager"
                       class="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-600 shadow-lg border border-slate-100 dark:border-white/5 transition-all active:scale-90">
                 <span class="material-icons text-sm">edit_note</span>
               </button>
               <button (click)="deleteEmployee(emp.id)" *ngIf="authService.isManager"
                       class="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 shadow-lg border border-slate-100 dark:border-white/5 transition-all active:scale-90">
                 <span class="material-icons text-sm">delete_sweep</span>
               </button>
             </div>
          </div>
        </div>
      </div>

      <!-- Tactical Pagination Controls -->
      <div *ngIf="!isLoading && filteredEmployees.length > itemsPerPage" class="flex items-center justify-center gap-6 pt-12">
        <button [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1; cdr.markForCheck()"
                class="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-600 disabled:opacity-20 border border-slate-100 dark:border-white/5 shadow-xl transition-all active:scale-90 flex items-center justify-center group">
          <span class="material-icons group-hover:-translate-x-1 transition-transform">west</span>
        </button>
        
        <div class="flex items-center gap-3 p-2 bg-slate-100/50 dark:bg-white/5 rounded-[1.5rem] border border-slate-200/50 dark:border-white/5">
           <button *ngFor="let page of visiblePages" 
                   (click)="setPage(page); cdr.markForCheck()"
                   class="w-12 h-12 rounded-xl text-[10px] font-black flex items-center justify-center transition-all transform active:scale-95 shadow-sm"
                   [ngClass]="currentPage === page 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' 
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'">
             {{ page }}
           </button>
        </div>

        <button [disabled]="currentPage === totalPages" (click)="currentPage = currentPage + 1; cdr.markForCheck()"
                class="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-600 disabled:opacity-20 border border-slate-100 dark:border-white/5 shadow-xl transition-all active:scale-90 flex items-center justify-center group">
          <span class="material-icons group-hover:translate-x-1 transition-transform">east</span>
        </button>
      </div>

      <!-- Null Reality State -->
      <div *ngIf="!isLoading && filteredEmployees.length === 0" class="min-h-[500px] flex flex-col items-center justify-center p-20 text-center animate-fade-in">
        <div class="relative mb-12 w-32 h-32 flex items-center justify-center">
          <div class="absolute inset-0 bg-primary-500/10 rounded-[3rem] animate-pulse"></div>
          <span class="material-icons text-7xl text-slate-200 dark:text-white/5 relative z-10">person_off</span>
        </div>
        <h3 class="text-3xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Personnel Data</h3>
        <p class="text-[10px] font-bold text-slate-400 mt-6 max-w-sm uppercase tracking-widest leading-loose">The current identity vector identifies no structural nodes in the corporate registry.</p>
        <button (click)="searchTerm = ''; onSearchChange()" class="mt-12 text-primary-600 text-[10px] font-black uppercase tracking-[0.3em] hover:underline transition-all">Reset Matrix Filter</button>
      </div>

      <!-- Modern Modal -->      <!-- Node Deployment Modal (Add/Edit) -->
      <div *ngIf="showModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-fade-in">
        <div class="glass-card w-full max-w-2xl p-0 overflow-hidden ring-1 ring-white/10 shadow-5xl animate-zoom-in border-0 rounded-[3.5rem] bg-white dark:bg-slate-950">
          <div class="px-12 py-12 bg-slate-900 dark:bg-black text-white relative">
            <h3 class="text-3xl font-black font-manrope tracking-tight leading-none mb-2">{{ editingId ? 'Refine Node' : 'Deploy Node' }}</h3>
            <p class="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Structural Identity Calibration Matrix</p>
            <button (click)="showModal = false; cdr.markForCheck()" class="absolute top-12 right-12 text-white/40 hover:text-white transition-colors">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="p-12 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Formal Identity</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">person_outline</span>
                  <input type="text" [(ngModel)]="form.name" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="Full Name Node">
                </div>
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Structural Code</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">fingerprint</span>
                  <input type="text" [(ngModel)]="form.employeeCode" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="EMP-XXX">
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Digital Communication Address</label>
              <div class="relative">
                <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">alternate_email</span>
                <input type="email" [(ngModel)]="form.email" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="node@enterprise.com">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Cellular Vector</label>
                <input type="text" [(ngModel)]="form.phone" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl p-6 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="+XX-XXXXXXXXXX">
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">WhatsApp Identifier</label>
                <input type="text" [(ngModel)]="form.whatsappName" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl p-6 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="Platform Profile Name">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Org Collective</label>
                <select [(ngModel)]="form.groupId" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl p-6 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all cursor-pointer">
                  <option [ngValue]="null">Select Group</option>
                  <option *ngFor="let g of groups; trackBy: trackByGroupId" [ngValue]="g.id">{{ g.name }}</option>
                </select>
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Task Force</label>
                <select [(ngModel)]="form.teamId" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl p-6 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all cursor-pointer">
                  <option [ngValue]="null">Select Team</option>
                  <option *ngFor="let t of teams; trackBy: trackByTeamId" [ngValue]="t.id">{{ t.name }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Professional Designation</label>
              <input type="text" [(ngModel)]="form.designation" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-2xl p-6 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="e.g. Lead Developer"/>
            </div>
          </div>

          <div class="px-12 py-10 bg-slate-50/50 dark:bg-white/[0.01] flex justify-end gap-6 items-center border-t border-slate-100 dark:border-white/5">
            <button (click)="showModal = false; cdr.markForCheck()" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Abort</button>
            <button (click)="saveEmployee()" class="px-14 py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.4em] shadow-4xl hover:scale-105 active:scale-95 transition-all">
              {{ editingId ? 'Re-Commit Node' : 'Initialize Node' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(var(--color-primary-500-rgb), 0.1); 
      border-radius: 20px;
    }
  `]
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

  constructor(private api: ApiService, public authService: AuthService, public cdr: ChangeDetectorRef) { }

  trackByEmployeeId(index: number, emp: Employee): number { return emp.id; }
  trackByGroupId(index: number, group: Group): number { return group.id; }
  trackByTeamId(index: number, team: Team): number { return team.id; }

  ngOnInit() {
    this.loadEmployees();
    this.api.getGroups().subscribe({
        next: g => { this.groups = g; this.cdr.markForCheck(); }
    });
    this.api.getActiveTeams().subscribe({
        next: t => { this.teams = t; this.cdr.markForCheck(); }
    });
  }

  loadEmployees() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.api.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
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
    this.cdr.markForCheck();
  }

  editEmployee(emp: Employee) {
    this.editingId = emp.id;
    this.form = { ...emp };
    this.showModal = true;
    this.cdr.markForCheck();
  }

  saveEmployee() {
    const obs = this.editingId
      ? this.api.updateEmployee(this.editingId, this.form)
      : this.api.createEmployee(this.form);
    obs.subscribe({ next: () => { 
        this.showModal = false; 
        this.loadEmployees(); 
        this.cdr.markForCheck();
    } });
  }

  deleteEmployee(id: number) {
    if (confirm('Are you sure you want to deactivate this employee?')) {
      this.api.deleteEmployee(id).subscribe(() => {
        this.loadEmployees();
        this.cdr.markForCheck();
      });
    }
  }

  onSearchChange() {
    this.cdr.markForCheck();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (confirm(`Import employees from ${file.name}?`)) {
        this.api.importEmployees(file).subscribe({
          next: (res) => {
            alert(res);
            this.loadEmployees();
            this.cdr.markForCheck();
          },
          error: (err) => {
            alert('Import failed: ' + err.message);
            this.cdr.markForCheck();
          }
        });
      }
    }
    event.target.value = null; // reset
  }
}
