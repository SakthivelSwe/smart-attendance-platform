import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LeaveRequest, Employee } from '../../core/models/interfaces';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header text-3xl font-extrabold tracking-tight">Leave Management</h1>
          <p class="page-subtitle text-surface-500">Track and manage employee leave requests</p>
        </div>
        <div class="flex gap-3">
          <select [(ngModel)]="statusFilter" (change)="loadLeaves()" class="input-field w-auto py-2">
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button (click)="openModal()" class="btn-primary py-2 px-6">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Apply Leave
          </button>
        </div>
      </div>

      <!-- Leave cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let leave of leaves" class="card p-5 group hover:shadow-xl transition-all duration-300 relative overflow-hidden">
          <!-- Status Strip -->
          <div class="absolute top-0 left-0 w-1 h-full" [ngClass]="{
            'bg-amber-500': leave.status === 'PENDING',
            'bg-emerald-500': leave.status === 'APPROVED',
            'bg-rose-500': leave.status === 'REJECTED'
          }"></div>

          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-primary-500/10">
                {{ leave.employeeName.charAt(0) }}
              </div>
              <div>
                <p class="font-bold text-surface-900 dark:text-white leading-tight capitalize">{{ leave.employeeName }}</p>
                <p class="text-[10px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest mt-0.5">{{ leave.leaveType }}</p>
              </div>
            </div>
            <span [class]="getStatusBadge(leave.status)">{{ leave.status }}</span>
          </div>

          <div class="space-y-4 mb-6">
            <div class="flex items-center gap-2.5 text-sm font-medium text-surface-600 dark:text-surface-300">
              <div class="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-800">
                <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <span>{{ leave.startDate }} <span class="text-surface-400 mx-1">→</span> {{ leave.endDate }}</span>
            </div>
            
            <div *ngIf="leave.reason" class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed bg-surface-50/50 dark:bg-surface-800/30 p-4 rounded-xl border border-surface-100 dark:border-surface-700/50">
               <span class="block text-[10px] font-bold text-surface-400 uppercase mb-2 tracking-tighter">REASON</span>
               "{{ leave.reason }}"
            </div>
          </div>

          <div *ngIf="authService.isAdmin && leave.status === 'PENDING'" class="flex gap-2">
            <button (click)="approveLeave(leave.id)" class="btn-success flex-1 py-2.5 text-xs font-bold uppercase tracking-wider">Approve</button>
            <button (click)="rejectLeave(leave.id)" class="btn-danger flex-1 py-2.5 text-xs font-bold uppercase tracking-wider">Reject</button>
          </div>
          
          <div *ngIf="leave.status !== 'PENDING' && (leave.adminRemarks || leave.approvedByName)" class="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 space-y-2">
             <div *ngIf="leave.approvedByName" class="flex items-center justify-between text-[10px] text-surface-400">
                <span class="font-bold uppercase tracking-tighter">Handled By</span>
                <span class="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-full">{{ leave.approvedByName }}</span>
             </div>
             <p *ngIf="leave.adminRemarks" class="text-sm text-surface-600 dark:text-surface-300 font-medium italic">"{{ leave.adminRemarks }}"</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="leaves.length === 0" class="col-span-full text-center py-24 card bg-surface-50/30 dark:bg-surface-800/10 border-dashed border-2">
          <div class="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg class="w-12 h-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-surface-900 dark:text-white mb-2">No Leave Records</h3>
          <p class="text-surface-500 max-w-xs mx-auto">There are no leave requests found for the selected filter. Try changing the status or Apply for a new one.</p>
        </div>
      </div>

      <!-- Add Leave Modal -->
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="modal-container max-w-lg overflow-hidden">
          <div class="p-6 border-b border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 flex justify-between items-center">
            <div>
              <h3 class="text-xl font-bold text-surface-900 dark:text-white">Apply for Leave</h3>
              <p class="text-xs text-surface-500 mt-1 uppercase tracking-tight font-medium">Employee Absence Request</p>
            </div>
            <button (click)="closeModal()" class="p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-full transition-colors text-surface-500">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div class="p-8 space-y-6">
            <div class="space-y-2">
              <label class="form-label">Employee Selection</label>
              <select [(ngModel)]="newLeave.employeeId" class="input-field shadow-sm">
                <option [ngValue]="0" disabled>Select an employee...</option>
                <option *ngFor="let emp of employees" [ngValue]="emp.id">{{ emp.name }} ({{ emp.employeeCode }})</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="form-label">Start Date</label>
                <input type="date" [(ngModel)]="newLeave.startDate" class="input-field shadow-sm">
              </div>
              <div class="space-y-2">
                <label class="form-label">End Date</label>
                <input type="date" [(ngModel)]="newLeave.endDate" class="input-field shadow-sm">
              </div>
            </div>

            <div class="space-y-2">
              <label class="form-label">Leave Type</label>
              <div class="grid grid-cols-2 gap-3">
                <button type="button" *ngFor="let type of ['CASUAL', 'SICK', 'EARNED', 'WFH']" 
                        (click)="newLeave.leaveType = type"
                        [class]="newLeave.leaveType === type ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-100 dark:border-surface-700'"
                        class="py-3 px-4 rounded-xl text-xs font-bold transition-all text-center">
                  {{ type }}
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="form-label">Reason for Leave</label>
              <textarea [(ngModel)]="newLeave.reason" rows="3" class="input-field shadow-sm max-h-32" placeholder="Tell us why you need this leave..."></textarea>
            </div>
          </div>

          <div class="p-6 bg-surface-50/50 dark:bg-surface-800/80 border-t border-surface-100 dark:border-surface-700 flex justify-end gap-3">
            <button (click)="closeModal()" class="btn-ghost" [disabled]="submitting">Discard</button>
            <button (click)="applyLeave()" class="btn-primary min-w-[160px]" [disabled]="submitting || !isValid()">
              <span *ngIf="!submitting" class="flex items-center gap-2">
                Submit Application
              </span>
              <span *ngIf="submitting" class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-pending { @apply bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider; }
    .badge-approved { @apply bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider; }
    .badge-rejected { @apply bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider; }
  `]
})
export class LeavesComponent implements OnInit {
  leaves: LeaveRequest[] = [];
  employees: Employee[] = [];
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

  constructor(private api: ApiService, public authService: AuthService) { }

  ngOnInit() {
    this.loadLeaves();
    this.loadEmployees();
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
    });
  }

  loadEmployees() {
    this.api.getEmployees().subscribe(data => this.employees = data);
  }

  getStatusBadge(status: string): string {
    const badges: any = {
      'PENDING': 'badge-pending',
      'APPROVED': 'badge-approved',
      'REJECTED': 'badge-rejected'
    };
    return badges[status] || 'badge';
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

  approveLeave(id: number) {
    const remarks = prompt('Admin remarks (optional):');
    this.api.approveLeave(id, remarks || undefined).subscribe(() => this.loadLeaves());
  }

  rejectLeave(id: number) {
    const remarks = prompt('Rejection reason (optional):');
    this.api.rejectLeave(id, remarks || undefined).subscribe(() => this.loadLeaves());
  }
}
