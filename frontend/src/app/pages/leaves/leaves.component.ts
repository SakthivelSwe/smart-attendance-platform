import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LeaveRequest, Employee, LeaveBalance, LeaveApprovalChain } from '../../core/models/interfaces';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 animate-fade-in pb-20">
      <!-- High-Fidelity Header & Strategic Controls -->
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-3">
            Personnel <span class="text-primary-600 dark:text-primary-400">Absence</span> Matrix
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Orchestrating leave request workflows and temporal deployment balance</p>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
          <!-- View Toggle: Architectural Tabs -->
          <div class="flex p-1.5 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5">
            <button (click)="viewMode = 'LIST'; cdr.markForCheck()" 
                    class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 flex items-center gap-3"
                    [ngClass]="viewMode === 'LIST' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-xl' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'">
              <span class="material-icons text-sm">view_agenda</span> Matrix View
            </button>
            <button (click)="viewMode = 'CALENDAR'; cdr.markForCheck()" 
                    class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 flex items-center gap-3"
                    [ngClass]="viewMode === 'CALENDAR' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-xl' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'">
              <span class="material-icons text-sm">calendar_view_month</span> Chronos View
            </button>
          </div>

          <div class="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10"></div>

          <div class="relative group" *ngIf="viewMode === 'LIST'">
            <select [(ngModel)]="statusFilter" (change)="loadLeaves()" 
                    class="bg-transparent border-0 py-2 pl-4 pr-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white focus:ring-0 cursor-pointer appearance-none">
              <option value="ALL">Full Spectrum</option>
              <option value="PENDING">Active Flow</option>
              <option value="APPROVED">Authorized</option>
              <option value="REJECTED">Evicted</option>
            </select>
            <span class="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary-500 transition-colors">filter_list</span>
          </div>

          <button (click)="openModal()" 
                  class="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/30 transition-all transform hover:-translate-y-1 active:scale-95">
            <span class="material-icons text-xl group-hover:rotate-180 transition-transform">bolt</span>
            <span class="text-[10px] font-black uppercase tracking-[0.2em]">Deploy Request</span>
          </button>
        </div>
      </div>

      <!-- Chronos View: Architectural Glass Calendar -->
      <div *ngIf="viewMode === 'CALENDAR'" class="glass-card p-10 border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-4xl animate-zoom-in">
         <div class="flex items-center justify-between mb-12">
            <div class="flex items-baseline gap-4">
              <h3 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none uppercase">{{ currentMonthName }}</h3>
              <span class="text-xl font-bold text-primary-500/40 font-manrope tabular-nums">{{ currentYear }}</span>
            </div>
            <div class="flex gap-4">
               <button (click)="prevMonth()" class="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 border border-slate-100 dark:border-white/5 transition-all hover:shadow-xl active:scale-90">
                  <span class="material-icons">west</span>
               </button>
               <button (click)="nextMonth()" class="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 border border-slate-100 dark:border-white/5 transition-all hover:shadow-xl active:scale-90">
                  <span class="material-icons">east</span>
               </button>
            </div>
         </div>
         
         <div class="grid grid-cols-7 gap-6">
            <div *ngFor="let day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" 
                 class="text-[10px] font-black text-slate-400 text-center py-6 uppercase tracking-[0.3em] font-outfit border-b border-slate-50 dark:border-white/5 mb-4">
               {{ day }}
            </div>
            
            <div *ngFor="let blank of blankDays; trackBy: trackByIndex" class="h-44 bg-slate-50/10 dark:bg-white/[0.02] rounded-[2rem] border border-dashed border-slate-100 dark:border-white/5 opacity-40"></div>
            
            <div *ngFor="let date of monthDays; trackBy: trackByIndex" 
                 class="h-44 bg-white/40 dark:bg-slate-800/20 rounded-[2rem] border border-slate-50 dark:border-white/5 p-4 overflow-hidden group hover:bg-white dark:hover:bg-slate-800 transition-all duration-500 relative flex flex-col">
               
               <div class="flex items-center justify-between mb-3">
                 <span [class]="isToday(date) 
                   ? 'w-10 h-10 flex items-center justify-center bg-primary-600 text-white rounded-[1rem] text-[10px] font-black shadow-2xl shadow-primary-500/40' 
                   : 'text-sm font-black text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white tabular-nums transition-colors'">{{ date }}</span>
               </div>
               
               <div class="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  <div *ngFor="let leave of getLeavesForDate(date); trackBy: trackByLeaveId" 
                       class="relative p-2 rounded-xl border border-transparent transition-all hover:scale-[1.05] cursor-pointer"
                       [class]="leave.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary-500/10 text-primary-600'">
                    <div class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full" [class]="leave.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-primary-500'"></div>
                      <span class="text-[8px] font-black uppercase tracking-tight truncate leading-none">{{ leave.employeeName.split(' ')[0] }}</span>
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- Matrix View: High-Fidelity Workflow Cards -->
      <div *ngIf="viewMode === 'LIST'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        <div *ngFor="let leave of leaves; trackBy: trackByLeaveId; let i = index" 
             class="glass-card group p-0 overflow-hidden border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-3xl transform hover:-translate-y-3 transition-all duration-700 animate-slide-up"
             [style.animation-delay]="i * 50 + 'ms'">
          
          <!-- Intensity Gradient Overlay -->
          <div class="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r" [ngClass]="{
            'from-amber-400 to-amber-600': leave.status === 'PENDING',
            'from-emerald-400 to-emerald-600': leave.status === 'APPROVED',
            'from-rose-400 to-rose-600': leave.status === 'REJECTED',
            'from-primary-400 to-indigo-600': leave.status === 'TL_APPROVED' || leave.status === 'MGR_REVIEW'
          }"></div>

          <div class="p-10">
            <div class="flex items-center gap-6 mb-10">
              <div class="relative">
                <div class="w-18 h-18 rounded-[2rem] bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-2xl shadow-inner group-hover:rotate-12 transition-transform">
                  {{ leave.employeeName.charAt(0) }}
                </div>
                <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800"
                     [ngClass]="{'bg-amber-500': leave.status === 'PENDING', 'bg-emerald-500': leave.status === 'APPROVED', 'bg-rose-500': leave.status === 'REJECTED'}">
                  <span class="material-icons text-white text-[12px]">{{ leave.status === 'APPROVED' ? 'check' : 'history' }}</span>
                </div>
              </div>
              
              <div class="min-w-0">
                <h3 class="text-xl font-black text-slate-900 dark:text-white font-manrope tracking-tight group-hover:text-primary-600 transition-colors truncate">{{ leave.employeeName }}</h3>
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest bg-primary-50 dark:bg-primary-900/40 px-3 py-1.5 rounded-xl border border-primary-100 dark:border-white/5">{{ leave.leaveType }}</span>
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10"></div>
                  <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">{{ leave.status }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-10 p-5 rounded-[2rem] bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div class="text-center">
                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Temporal Start</p>
                <p class="text-xs font-black text-slate-900 dark:text-white tabular-nums">{{ leave.startDate | date:'MMM dd, yyyy' }}</p>
              </div>
              <div class="text-center border-l border-slate-100 dark:border-white/5">
                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Temporal End</p>
                <p class="text-xs font-black text-slate-900 dark:text-white tabular-nums">{{ leave.endDate | date:'MMM dd, yyyy' }}</p>
              </div>
            </div>

            <div *ngIf="leave.reason" class="relative mb-10 group/quote">
               <span class="material-icons absolute -top-4 -left-2 text-primary-500/20 text-4xl group-hover/quote:text-primary-500/40 transition-colors">format_quote</span>
               <p class="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-3 pl-6 pr-4">{{ leave.reason }}</p>
            </div>

            <!-- Strategic Approval Flow -->
            <div *ngIf="leave.status !== 'APPROVED' && leave.status !== 'REJECTED' && leave.status !== 'CANCELLED'" class="grid grid-cols-2 gap-4">
              <ng-container *ngIf="authService.isTeamLead && leave.status === 'PENDING'">
                 <button (click)="approveLeaveByTL(leave.id)" class="py-4 rounded-xl bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all active:scale-95">Approve Flow</button>
                 <button (click)="rejectLeave(leave.id)" class="py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-rose-500 font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95">Evict Node</button>
              </ng-container>

              <ng-container *ngIf="(authService.isManager || authService.isAdmin)">
                 <button (click)="approveLeaveByManager(leave.id)" class="py-4 rounded-xl bg-primary-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all active:scale-95">Authorize Absence</button>
                 <button (click)="rejectLeave(leave.id)" class="py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-rose-500 font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95">Evict Node</button>
              </ng-container>
            </div>
            
            <!-- Audit Trail: Visual Connection -->
            <div *ngIf="leave.approvalChain && leave.approvalChain.length > 0" class="mt-10 pt-8 border-t border-slate-50 dark:border-white/5 space-y-4">
               <h4 class="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 flex items-center gap-2">
                 <span class="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse"></span> Tactical Audit Log
               </h4>
               <div *ngFor="let chain of leave.approvalChain; trackBy: trackByChainId" 
                    class="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-white/5 hover:ring-primary-500/30 transition-all">
                 <div class="w-8 h-8 rounded-xl bg-slate-50/50 dark:bg-white/5 flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5">
                    <span class="material-icons text-sm" [ngClass]="chain.action === 'APPROVED' ? 'text-emerald-500' : 'text-primary-500'">{{ chain.action === 'APPROVED' ? 'verified_user' : 'history_edu' }}</span>
                 </div>
                 <div class="min-w-0">
                    <p class="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase">{{ chain.approverName }}</p>
                    <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{{ chain.approverRole }} — {{ chain.createdAt | date:'MMM dd' }}</p>
                    <p *ngIf="chain.remarks" class="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-2 italic"> "{{ chain.remarks }}"</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Null State: Absence Vacuum -->
      <div *ngIf="leaves.length === 0" class="min-h-[500px] flex flex-col items-center justify-center glass-card border-dashed border-4 border-slate-100 dark:border-white/5 rounded-[4rem]">
        <div class="relative mb-10 w-32 h-32 flex items-center justify-center">
           <div class="absolute inset-0 bg-primary-500/10 rounded-[3rem] animate-pulse"></div>
           <span class="material-icons text-7xl text-slate-200 dark:text-white/5 relative z-10">layers_clear</span>
        </div>
        <h3 class="text-2xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Absence Data</h3>
        <p class="text-[10px] font-bold text-slate-400 mt-6 max-w-sm text-center uppercase tracking-widest leading-loose">The temporal matrix is fully populated. All personnel nodes are currently active.</p>
        <button (click)="openModal()" class="mt-10 px-10 py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all">Initialize Application</button>
      </div>

      <!-- Deeper Glass Modal: Tactical Entry -->
      <div *ngIf="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-fade-in">
        <div class="glass-card w-full max-w-2xl p-0 overflow-hidden ring-1 ring-white/30 shadow-5xl animate-zoom-in border-0 rounded-[3rem]">
          <div class="px-12 py-10 bg-slate-900 text-white relative flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-black font-manrope tracking-tight leading-none mb-2">Formulate Absence</h3>
              <p class="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Strategic Temporal Exception Request</p>
            </div>
            <button (click)="closeModal()" class="w-14 h-14 rounded-[1.5rem] bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group">
               <span class="material-icons text-white/40 group-hover:text-white group-hover:rotate-90 transition-all">close</span>
            </button>
          </div>
          
          <div class="p-12 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Target Personnel Node</label>
              <select [(ngModel)]="newLeave.employeeId" (change)="loadBalances(newLeave.employeeId!); cdr.markForCheck()" class="w-full bg-slate-50 dark:bg-slate-800/50 border-0 rounded-[2rem] p-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 cursor-pointer appearance-none transition-all">
                <option [ngValue]="0" disabled>Select contributing employee...</option>
                <option *ngFor="let emp of employees; trackBy: trackByEmployeeId" [ngValue]="emp.id">{{ emp.name }} • ID: {{ emp.employeeCode }}</option>
              </select>
            </div>

            <!-- Balanced Displays -->
            <div *ngIf="balances.length > 0" class="p-8 rounded-[2.5rem] bg-indigo-50/20 dark:bg-white/[0.02] border-2 border-dashed border-indigo-100/50 dark:border-white/5 animate-fade-in">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                   <div *ngFor="let bal of balances; trackBy: trackByBalanceId" class="text-center group/bal">
                      <div class="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 group-hover/bal:text-primary-500 transition-colors">{{ bal.leaveType }}</div>
                      <div class="text-2xl font-black text-slate-900 dark:text-white font-manrope group-hover/bal:scale-125 transition-transform">{{ bal.remainingDays }}<span class="text-[10px] text-slate-300 ml-1">v</span></div>
                   </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-10">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 text-center block">Chronological Vector Start</label>
                <input type="date" [(ngModel)]="newLeave.startDate" class="w-full bg-slate-50 dark:bg-slate-800/50 border-0 rounded-[2rem] p-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 text-center transition-all">
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 text-center block">Chronological Vector End</label>
                <input type="date" [(ngModel)]="newLeave.endDate" class="w-full bg-slate-50 dark:bg-slate-800/50 border-0 rounded-[2rem] p-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 text-center transition-all">
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 block">Absence Pattern Classification</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button type="button" *ngFor="let type of ['CASUAL', 'SICK', 'EARNED', 'WFH']; trackBy: trackByIndex" 
                        (click)="newLeave.leaveType = type; cdr.markForCheck()"
                        [class]="newLeave.leaveType === type ? 'bg-primary-600 text-white shadow-2xl shadow-primary-500/30' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-white/5'"
                        class="py-5 px-6 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-90">
                  {{ type }}
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 block">Application Logic & Justification</label>
              <textarea [(ngModel)]="newLeave.reason" rows="4" class="w-full bg-slate-50 dark:bg-slate-800/50 border-0 rounded-[2.5rem] p-8 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/10 resize-none transition-all shadow-inner" placeholder="Provide professional context for the requested temporal gap..."></textarea>
            </div>
          </div>

          <div class="px-12 py-10 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end gap-6 items-center">
            <button (click)="closeModal()" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" [disabled]="submitting">Abort Operation</button>
            <button (click)="applyLeave()" class="px-14 py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.35em] shadow-4xl hover:scale-105 active:scale-95 transition-all transform" [disabled]="submitting || !isValid()">
              {{ submitting ? 'Transmitting Data...' : 'Commit Application' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(var(--color-primary-500-rgb), 0.1); 
      border-radius: 20px;
    }
  `]
})
export class LeavesComponent implements OnInit {
  leaves: LeaveRequest[] = [];
  employees: Employee[] = [];
  balances: LeaveBalance[] = [];
  statusFilter = 'ALL';
  showModal = false;
  submitting = false;

  newLeave: Partial<LeaveRequest> = {
    employeeId: 0,
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: 'CASUAL',
    status: 'PENDING'
  };

  viewMode: 'LIST' | 'CALENDAR' = 'LIST';

  // Calendar properties
  currentDate = new Date();
  currentMonthName = '';
  currentYear = 0;
  blankDays: number[] = [];
  monthDays: number[] = [];

  constructor(private api: ApiService, public authService: AuthService, public cdr: ChangeDetectorRef) { }

  trackByLeaveId(index: number, item: LeaveRequest): number { return item.id; }
  trackByEmployeeId(index: number, item: Employee): number { return item.id; }
  trackByBalanceId(index: number, item: LeaveBalance): number { return item.id; }
  trackByChainId(index: number, item: LeaveApprovalChain): number { return item.id; }
  trackByIndex(index: number, item: any): number { return index; }

  ngOnInit() {
    this.loadLeaves();
    this.loadEmployees();
    this.generateCalendar();
  }

  generateCalendar() {
    this.currentMonthName = this.currentDate.toLocaleString('default', { month: 'long' });
    this.currentYear = this.currentDate.getFullYear();

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.blankDays = Array(firstDay).fill(0).map((_, i) => i);
    this.monthDays = Array(daysInMonth).fill(0).map((_, i) => i + 1);
  }

  isToday(date: number): boolean {
    const today = new Date();
    return this.currentDate.getFullYear() === today.getFullYear() &&
      this.currentDate.getMonth() === today.getMonth() &&
      date === today.getDate();
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
    this.cdr.markForCheck();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
    this.cdr.markForCheck();
  }

  getLeavesForDate(date: number): LeaveRequest[] {
    const checkDate = new Date(Date.UTC(this.currentDate.getFullYear(), this.currentDate.getMonth(), date));
    // Format to YYYY-MM-DD
    const dateStr = checkDate.toISOString().split('T')[0];

    return this.leaves.filter(leave => {
      // Exclude Rejected and Cancelled from calendar
      if (leave.status === 'REJECTED' || leave.status === 'CANCELLED') return false;
      return dateStr >= leave.startDate && dateStr <= leave.endDate;
    });
  }

  loadLeaves() {
    const obs = this.statusFilter === 'PENDING'
      ? this.api.getPendingLeaves()
      : (this.statusFilter === 'ALL' ? this.api.getLeaves() : this.api.getLeaves());

    obs.subscribe(data => {
      if (this.statusFilter === 'ALL') {
        this.leaves = data;
      } else {
        this.leaves = data.filter(l => l.status === this.statusFilter);
      }
      this.cdr.markForCheck();
    });
  }

  loadEmployees() {
    this.api.getEmployees().subscribe(data => {
      this.employees = data;
      this.cdr.markForCheck();
    });
  }

  loadBalances(employeeId: number) {
    this.balances = [];
    if (!employeeId) return;
    this.api.getLeaveBalances(employeeId).subscribe(data => {
      this.balances = data;
      this.cdr.markForCheck();
    });
  }

  getStatusBadge(status: string): string {
    const badges: any = {
      'PENDING': 'badge-pending',
      'TL_APPROVED': 'badge-tl_approved',
      'MGR_REVIEW': 'badge-mgr_review',
      'APPROVED': 'badge-approved',
      'REJECTED': 'badge-rejected',
      'CANCELLED': 'badge-cancelled'
    };
    return badges[status] || 'badge-pending';
  }

  openModal() {
    this.showModal = true;
    const today = new Date().toISOString().split('T')[0];
    this.newLeave = {
      employeeId: 0,
      startDate: today,
      endDate: today,
      reason: '',
      leaveType: 'CASUAL',
      status: 'PENDING'
    };
  }

  closeModal() {
    this.showModal = false;
    this.balances = [];
  }

  isValid() {
    return this.newLeave.employeeId && this.newLeave.startDate && this.newLeave.endDate && this.newLeave.reason;
  }

  applyLeave() {
    if (!this.isValid()) return;
    this.submitting = true;
    this.api.applyLeave(this.newLeave).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal();
        this.loadLeaves();
      },
      error: () => {
        this.submitting = false;
        alert('Failed to submit leave request');
      }
    });
  }

  approveLeaveByTL(id: number) {
    const remarks = prompt('TL Remarks (optional):');
    this.api.approveLeaveByTL(id, remarks || undefined).subscribe(() => {
        this.loadLeaves();
        this.cdr.markForCheck();
    });
  }

  approveLeaveByManager(id: number) {
    const remarks = prompt('Manager Remarks (optional):');
    this.api.approveLeaveByManager(id, remarks || undefined).subscribe(() => {
        this.loadLeaves();
        this.cdr.markForCheck();
    });
  }

  rejectLeave(id: number) {
    const remarks = prompt('Rejection reason (required):');
    if (!remarks) return alert("Rejection reason is required.");
    this.api.rejectLeave(id, remarks).subscribe(() => {
        this.loadLeaves();
        this.cdr.markForCheck();
    });
  }

  cancelLeave(id: number) {
    const remarks = prompt('Cancellation reason (optional):');
    if (confirm("Are you sure you want to cancel this leave? Balances will be restored.")) {
      this.api.cancelLeave(id, remarks || undefined).subscribe(() => {
          this.loadLeaves();
          this.cdr.markForCheck();
      });
    }
  }
}
