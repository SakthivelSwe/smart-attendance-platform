import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { MonthlySummary } from '../../core/models/interfaces';

@Component({
    selector: 'app-summary',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header">Monthly Summary</h1>
          <p class="page-subtitle">Monthly attendance aggregation and reports</p>
        </div>
        <div class="flex items-center gap-3">
          <select [(ngModel)]="selectedMonth" (change)="loadSummary()" class="input-field w-auto">
            <option *ngFor="let m of months" [ngValue]="m.value">{{ m.label }}</option>
          </select>
          <select [(ngModel)]="selectedYear" (change)="loadSummary()" class="input-field w-auto">
            <option *ngFor="let y of years" [ngValue]="y">{{ y }}</option>
          </select>
          <button *ngIf="authService.isAdmin" (click)="generateSummary()" class="btn-primary whitespace-nowrap">Generate</button>
        </div>
      </div>

      <!-- Summary table -->
      <div class="table-container">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="table-header">
                <th class="text-left px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Employee</th>
                <th class="text-center px-4 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">WFO</th>
                <th class="text-center px-4 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">WFH</th>
                <th class="text-center px-4 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Leave</th>
                <th class="text-center px-4 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Holiday</th>
                <th class="text-center px-4 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Absent</th>
                <th class="text-center px-4 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Working Days</th>
                <th class="text-center px-4 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Attendance %</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)]">
              <tr *ngFor="let s of summaries" class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                      {{ s.employeeName?.charAt(0) || '?' }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-[var(--text-primary)]">{{ s.employeeName }}</p>
                      <p class="text-xs text-[var(--text-secondary)]">{{ s.employeeCode }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 text-center"><span class="badge-wfo">{{ s.wfoCount }}</span></td>
                <td class="px-4 py-4 text-center"><span class="badge-wfh">{{ s.wfhCount }}</span></td>
                <td class="px-4 py-4 text-center"><span class="badge-leave">{{ s.leaveCount }}</span></td>
                <td class="px-4 py-4 text-center"><span class="badge-holiday">{{ s.holidayCount }}</span></td>
                <td class="px-4 py-4 text-center"><span class="badge-absent">{{ s.absentCount }}</span></td>
                <td class="px-4 py-4 text-center text-sm font-medium text-[var(--text-primary)]">{{ s.totalWorkingDays }}</td>
                <td class="px-4 py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-16 h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [class.bg-emerald-500]="s.attendancePercentage >= 80"
                           [class.bg-amber-500]="s.attendancePercentage >= 50 && s.attendancePercentage < 80"
                           [class.bg-red-500]="s.attendancePercentage < 50"
                           [style.width.%]="s.attendancePercentage">
                      </div>
                    </div>
                    <span class="text-sm font-semibold"
                          [class.text-emerald-600]="s.attendancePercentage >= 80"
                          [class.text-amber-600]="s.attendancePercentage >= 50 && s.attendancePercentage < 80"
                          [class.text-red-600]="s.attendancePercentage < 50">
                      {{ s.attendancePercentage?.toFixed(1) }}%
                    </span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="summaries.length === 0">
                <td colspan="8" class="px-6 py-12 text-center text-[var(--text-secondary)]">
                  No summary data available. Click "Generate" to create a summary.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SummaryComponent implements OnInit {
    summaries: MonthlySummary[] = [];
    selectedMonth = new Date().getMonth() + 1;
    selectedYear = new Date().getFullYear();

    months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2000, i).toLocaleString('default', { month: 'long' })
    }));

    years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    constructor(private api: ApiService, public authService: AuthService) { }

    ngOnInit() { this.loadSummary(); }

    loadSummary() {
        this.api.getMonthlySummary(this.selectedMonth, this.selectedYear).subscribe(data => this.summaries = data);
    }

    generateSummary() {
        this.api.generateSummary(this.selectedMonth, this.selectedYear).subscribe(data => this.summaries = data);
    }
}
