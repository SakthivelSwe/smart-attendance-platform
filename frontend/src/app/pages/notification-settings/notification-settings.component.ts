import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationPreference } from '../../core/models/interfaces';

@Component({
    selector: 'app-notification-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
      <div class="mb-8">
        <h1 class="page-header">Notification Settings</h1>
        <p class="page-subtitle">Manage how and when you receive alerts from the Smart Attendance Platform</p>
      </div>

      <div *ngIf="isLoading" class="max-w-4xl animate-pulse space-y-6">
        <div class="card p-6 h-40"></div>
        <div class="card p-6 h-64"></div>
      </div>

      <div *ngIf="!isLoading && preferences" class="max-w-4xl space-y-6">
        
        <!-- Channels -->
        <div class="card p-6">
          <h3 class="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span class="material-icons text-primary-500">campaign</span> Delivery Channels
          </h3>
          <p class="text-sm text-[var(--text-secondary)] mb-6">Choose where you'd like to receive notifications.</p>
          
          <div class="space-y-4">
            <label class="flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <span class="material-icons">email</span>
                </div>
                <div>
                  <p class="font-semibold text-[var(--text-primary)] text-sm">Email Notifications</p>
                  <p class="text-xs text-[var(--text-secondary)]">Receive alerts at your registered email address</p>
                </div>
              </div>
              <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer scale-[0.8]" [(ngModel)]="preferences.emailEnabled"/>
                <label class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </label>

            <!-- WhatsApp (Stubbed for now, visually toggleable but maybe unfunctional if api not strict yet) -->
             <label class="flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer opacity-75">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <span class="material-icons">chat</span>
                </div>
                <div>
                  <p class="font-semibold text-[var(--text-primary)] text-sm">WhatsApp Notifications (Beta)</p>
                  <p class="text-xs text-[var(--text-secondary)]">Receive critical alerts on your mobile</p>
                </div>
              </div>
              <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer scale-[0.8]" [(ngModel)]="preferences.whatsappEnabled"/>
                <label class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </label>
          </div>
        </div>

        <!-- Role-specific Preferences -->
        <div class="card p-6">
          <h3 class="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span class="material-icons text-indigo-500">tune</span> Alert Preferences
          </h3>
          <p class="text-sm text-[var(--text-secondary)] mb-6">Customize which events trigger a notification based on your role.</p>
          
          <div class="space-y-6 divide-y divide-surface-200 dark:divide-surface-700">
            
            <!-- Team Lead Settings -->
            <div *ngIf="isTeamLeadOrHigher" class="pt-2">
              <h4 class="text-sm border-b-2 border-primary-500 pb-1 mb-4 inline-block font-bold text-surface-600 dark:text-surface-300 uppercase tracking-wider">Team Lead Alerts</h4>
              
              <div class="space-y-4">
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" [(ngModel)]="preferences.teamDailySummary" class="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"/>
                  <div>
                    <p class="text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors">Daily Team Summary</p>
                    <p class="text-sm text-[var(--text-secondary)]">Receive an end-of-day attendance roundup for your team</p>
                  </div>
                </label>
                
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" [(ngModel)]="preferences.absenceAlert" class="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"/>
                  <div>
                    <p class="text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors">Absence Alerts</p>
                    <p class="text-sm text-[var(--text-secondary)]">Instant notification when a team member is marked absent</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Manager Settings -->
            <div *ngIf="isManagerOrHigher" class="pt-6">
              <h4 class="text-sm border-b-2 border-indigo-500 pb-1 mb-4 inline-block font-bold text-surface-600 dark:text-surface-300 uppercase tracking-wider">Manager Alerts</h4>
              
              <div class="space-y-4">
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" [(ngModel)]="preferences.managerDailySummary" class="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"/>
                  <div>
                    <p class="text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors">Multiple Team Daily Summary</p>
                    <p class="text-sm text-[var(--text-secondary)]">Aggregated attendance report across all teams you manage</p>
                  </div>
                </label>

                <div>
                  <label class="flex items-start gap-3 cursor-pointer group mb-2">
                    <input type="checkbox" [(ngModel)]="preferences.lowAttendanceAlert" class="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"/>
                    <div>
                      <p class="text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors">Low Attendance Threshold Alert</p>
                      <p class="text-sm text-[var(--text-secondary)]">Notify me if a team's attendance drops below a certain rate</p>
                    </div>
                  </label>
                  
                  <div *ngIf="preferences.lowAttendanceAlert" class="ml-7 mt-2 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg flex items-center gap-4 border border-surface-200 dark:border-surface-700 animate-fade-in">
                    <span class="text-sm font-medium text-[var(--text-secondary)]">Threshold Rate:</span>
                    <input type="range" min="30" max="95" step="5" [(ngModel)]="preferences.lowAttendanceThreshold" class="w-48 accent-primary-600">
                    <span class="text-sm font-bold w-12 text-center py-1 px-2 rounded bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600">{{ preferences.lowAttendanceThreshold }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- General Alerts -->
            <div class="pt-6">
              <h4 class="text-sm border-b-2 border-emerald-500 pb-1 mb-4 inline-block font-bold text-surface-600 dark:text-surface-300 uppercase tracking-wider">General Alerts</h4>
              
              <div class="space-y-4">
                 <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" [(ngModel)]="preferences.leaveRequestAlert" class="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"/>
                  <div>
                    <p class="text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors">Leave Action Alerts</p>
                    <p class="text-sm text-[var(--text-secondary)]">Notify me about new leave requests requiring my approval</p>
                  </div>
                </label>
                
                 <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" [(ngModel)]="preferences.leaveStatusAlert" class="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"/>
                  <div>
                    <p class="text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors">Leave Status Updates</p>
                    <p class="text-sm text-[var(--text-secondary)]">Notify me when my own leave request is approved or rejected</p>
                  </div>
                </label>
              </div>
            </div>

          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button (click)="savePreferences()" [disabled]="isSaving" class="btn-primary flex items-center gap-2">
            <span *ngIf="isSaving" class="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin"></span>
            <span class="material-icons text-sm" *ngIf="!isSaving">save</span> {{ isSaving ? 'Saving...' : 'Save Preferences' }}
          </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    /* Toggle switch styles */
    .toggle-checkbox:checked { right: 0; border-color: #68D391; }
    .toggle-checkbox:checked + .toggle-label { background-color: #68D391; }
    .toggle-checkbox { right: 0; z-index: 1; border-color: #e2e8f0; transition: all 0.3s; }
    .toggle-checkbox:not(:checked) { transform: translateX(-100%) scale(0.8); right: 24px; }
  `]
})
export class NotificationSettingsComponent implements OnInit {
    preferences: NotificationPreference | null = null;
    isLoading = true;
    isSaving = false;

    constructor(private api: ApiService, private authService: AuthService) { }

    get isTeamLeadOrHigher() {
        return this.authService.hasMinRole('TEAM_LEAD');
    }

    get isManagerOrHigher() {
        return this.authService.hasMinRole('MANAGER');
    }

    ngOnInit(): void {
        const userId = this.authService.currentUser?.userId;
        if (userId) {
            this.api.getNotificationPreferences(userId).subscribe({
                next: (data) => {
                    this.preferences = data;
                    this.isLoading = false;
                },
                error: () => {
                    this.isLoading = false;
                }
            });
        }
    }

    savePreferences() {
        if (!this.preferences) return;

        this.isSaving = true;
        const userId = this.authService.currentUser?.userId;
        if (userId) {
            this.api.updateNotificationPreferences(userId, this.preferences).subscribe({
                next: (data) => {
                    this.preferences = data;
                    this.isSaving = false;
                    // Optionally show a toast here
                },
                error: () => {
                    this.isSaving = false;
                }
            });
        }
    }
}
