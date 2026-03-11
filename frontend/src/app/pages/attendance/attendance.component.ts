import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Attendance } from '../../core/models/interfaces';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, LottieComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 animate-fade-in pb-20">
      <!-- High-Fidelity Header & Strategic Controls -->
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white font-manrope tracking-tight leading-none mb-3">
            Personnel <span class="text-primary-600 dark:text-primary-400">Deployment</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Managing real-time presence markers and structural availability flow</p>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
          <div *ngIf="automationConfigured" 
               class="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-[10px] text-emerald-600 font-black uppercase tracking-widest shadow-inner">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Automated Vector Active
          </div>

          <div class="relative group">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 material-icons text-lg group-hover:scale-110 transition-transform">calendar_today</span>
            <input type="date" [(ngModel)]="selectedDate" (change)="loadAttendance()"
                   class="bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-12 pr-6 py-4 text-xs font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer tabular-nums shadow-inner"/>
          </div>
          
          <div class="flex items-center gap-3">
            <button *ngIf="authService.isManager" (click)="showEmailModal = true" 
                    class="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/30 transition-all transform hover:-translate-y-1 active:scale-95">
              <span class="material-icons text-xl group-hover:rotate-12 transition-transform">mail_lock</span>
              <span class="text-[10px] font-black uppercase tracking-[0.2em]">Ingest Email</span>
            </button>
            
            <button *ngIf="authService.isManager" (click)="showProcessModal = true" 
                    class="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95">
              <span class="material-icons text-xl text-slate-400 group-hover:text-primary-500 transition-colors">history_edu</span>
              <span class="text-[10px] font-black uppercase tracking-[0.2em]">Manual Entry</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Execution Feedback Banner -->
      <div *ngIf="emailMessage" class="glass-card p-6 border-l-4 animate-fade-in flex items-center justify-between"
           [ngClass]="emailSuccess ? 'border-emerald-500 bg-emerald-500/5' : 'border-rose-500 bg-rose-500/5'">
        <div class="flex items-center gap-5">
           <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                [ngClass]="emailSuccess ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'">
              <span class="material-icons">{{ emailSuccess ? 'verified' : 'report_problem' }}</span>
           </div>
           <div>
             <h4 class="text-xs font-black uppercase tracking-widest" [ngClass]="emailSuccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'">Vector Processing {{ emailSuccess ? 'Successful' : 'Terminated' }}</h4>
             <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{{ emailMessage }}</p>
           </div>
        </div>
        <button (click)="emailMessage = ''; cdr.markForCheck()" class="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
          <span class="material-icons text-slate-400">close</span>
        </button>
      </div>

      <!-- Tactical Matrix Filters -->
      <div class="flex flex-wrap items-center gap-3 p-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl w-fit">
        <button *ngFor="let f of filters; trackBy: trackByFilterLabel"
                (click)="activeFilter = f.value; cdr.markForCheck()"
                class="relative px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 overflow-hidden group"
                [ngClass]="activeFilter === f.value 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' 
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'">
          <span class="relative z-10">{{ f.label }}</span>
          <span class="relative z-10 ml-2 py-0.5 px-2 rounded-lg bg-white/10 dark:bg-slate-900/10 tabular-nums text-[8px]">{{ getCount(f.value) }}</span>
          <div *ngIf="activeFilter === f.value" class="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent"></div>
        </button>
      </div>

      <!-- Deployment Matrix: High-Fidelity Table -->
      <div class="glass-card p-0 overflow-hidden border-0 ring-1 ring-slate-100 dark:ring-white/5 shadow-4xl animate-zoom-in">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr class="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Personnel Node</th>
                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Structural ID</th>
                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Ingress</th>
                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Egress</th>
                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Presence Status</th>
                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Vector Source</th>
                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Remarks</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-white/5">
              <tr *ngFor="let a of filteredAttendance; trackBy: trackByAttendanceId; let i = index" 
                  class="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all duration-500 animate-slide-up"
                  [style.animation-delay]="i * 40 + 'ms'">
                <td class="py-8 px-10">
                   <div class="flex items-center gap-5">
                     <div class="relative">
                       <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-lg shadow-inner group-hover:scale-110 group-hover:rotate-12 transition-all">
                         {{ a.employeeName.charAt(0) }}
                       </div>
                       <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                            [ngClass]="a.status === 'WFO' || a.status === 'WFH' ? 'bg-emerald-500' : 'bg-slate-300'"></div>
                     </div>
                     <div class="min-w-0">
                       <p class="text-sm font-black text-slate-900 dark:text-white font-manrope tracking-tight uppercase group-hover:text-primary-600 transition-colors truncate">{{ a.employeeName }}</p>
                       <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ a.groupName }}</p>
                     </div>
                   </div>
                </td>
                <td class="py-8 px-10">
                  <span class="px-3 py-2 rounded-xl bg-slate-100/50 dark:bg-white/5 text-[10px] font-black font-mono text-slate-500 border border-slate-100 dark:border-white/5 tabular-nums">
                    {{ a.employeeCode }}
                  </span>
                </td>
                <td class="py-8 px-10">
                   <div class="flex items-center gap-2">
                     <span class="material-icons text-emerald-500 text-sm" *ngIf="a.inTime">login</span>
                     <span class="text-xs font-black tabular-nums font-manrope transition-all" [ngClass]="a.inTime ? 'text-emerald-600 group-hover:scale-110' : 'text-slate-200 dark:text-white/5 font-normal'">
                       {{ a.inTime || 'N/A' }}
                     </span>
                   </div>
                </td>
                <td class="py-8 px-10">
                   <div class="flex items-center gap-2">
                     <span class="material-icons text-indigo-500 text-sm" *ngIf="a.outTime">logout</span>
                     <span class="text-xs font-black tabular-nums font-manrope transition-all" [ngClass]="a.outTime ? 'text-indigo-600 group-hover:scale-110' : 'text-slate-200 dark:text-white/5 font-normal'">
                       {{ a.outTime || 'N/A' }}
                     </span>
                   </div>
                </td>
                <td class="py-8 px-10">
                  <span [class]="getStatusBadge(a.status)" 
                        class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all group-hover:scale-110 group-hover:shadow-lg">
                    {{ a.status }}
                  </span>
                </td>
                <td class="py-8 px-10">
                  <div class="inline-flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all" 
                       [ngClass]="a.source === 'WHATSAPP' 
                         ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10' 
                         : 'bg-slate-500/5 text-slate-500 border-slate-500/10'">
                    <span class="material-icons text-sm">{{ a.source === 'WHATSAPP' ? 'whatsapp' : 'laptop_mac' }}</span>
                    <span class="text-[9px] font-black uppercase tracking-widest">{{ a.source || 'Structural' }}</span>
                  </div>
                </td>
                <td class="py-8 px-10">
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[250px] italic line-clamp-2 truncate">
                    "{{ a.remarks || 'Void' }}"
                  </p>
                </td>
              </tr>
              
              <!-- Refined Loading Skeletons -->
              <tr *ngIf="isLoading">
                <td colspan="7" class="p-0">
                  <div class="divide-y divide-slate-50 dark:divide-white/5">
                    <div *ngFor="let i of [1,2,3,4,5,6]" class="px-10 py-10 flex items-center justify-between animate-pulse">
                      <div class="flex items-center gap-5">
                        <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5"></div>
                        <div class="space-y-3">
                          <div class="h-4 bg-slate-100 dark:bg-white/5 rounded-full w-48"></div>
                          <div class="h-2 bg-slate-50 dark:bg-white/[0.02] rounded-full w-24"></div>
                        </div>
                      </div>
                      <div class="h-4 bg-slate-100 dark:bg-white/5 rounded-full w-16"></div>
                      <div class="h-4 bg-slate-100 dark:bg-white/5 rounded-full w-24"></div>
                      <div class="h-4 bg-slate-100 dark:bg-white/5 rounded-full w-24"></div>
                      <div class="h-10 bg-slate-100 dark:bg-white/5 rounded-xl w-32"></div>
                      <div class="h-10 bg-slate-100 dark:bg-white/5 rounded-2xl w-32"></div>
                      <div class="h-4 bg-slate-100 dark:bg-white/5 rounded-full w-48"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Matrix Null Reality -->
        <div *ngIf="!isLoading && filteredAttendance.length === 0" class="min-h-[500px] flex flex-col items-center justify-center p-20 animate-fade-in">
          <div class="relative mb-12 w-32 h-32 flex items-center justify-center">
            <div class="absolute inset-0 bg-primary-500/10 rounded-[3rem] animate-pulse"></div>
            <span class="material-icons text-7xl text-slate-200 dark:text-white/5 relative z-10">visibility_off</span>
          </div>
          <h3 class="text-3xl font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">Zero Presence Vectors</h3>
          <p class="text-[10px] font-bold text-slate-400 mt-6 max-w-sm text-center uppercase tracking-widest leading-loose">The selected temporal frame contains no deployment data matching current structural filters.</p>
          <button (click)="activeFilter = 'ALL'; cdr.markForCheck()" class="mt-12 px-10 py-5 rounded-2xl border-2 border-primary-500/20 text-primary-600 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary-500/5 transition-all active:scale-95">Reset Matrix Filters</button>
        </div>
      </div>

      <!-- Ingest Vector Modal (Email) -->
      <div *ngIf="showEmailModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-fade-in">
        <div class="glass-card w-full max-w-xl p-0 overflow-hidden ring-1 ring-white/10 shadow-5xl animate-zoom-in border-0 rounded-[3rem]">
          <div class="px-10 py-10 bg-slate-900 text-white relative">
            <h3 class="text-3xl font-black font-manrope tracking-tight leading-none mb-2">Vector Ingestion</h3>
            <p class="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Automated Gmail Extraction Gateway</p>
          </div>

          <div class="p-10 space-y-10 bg-white dark:bg-slate-950 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <!-- OAuth2 Status Vector -->
            <div *ngIf="oauthConnected" class="p-8 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-6 animate-fade-in shadow-inner">
              <div class="w-16 h-16 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 shrink-0">
                <span class="material-icons text-3xl">verified</span>
              </div>
              <div class="min-w-0">
                 <p class="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Authenticated Node</p>
                 <p class="text-sm font-black text-slate-900 dark:text-white truncate tabular-nums">{{ gmailEmail }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Target Temporal Slice</label>
                <input type="date" [(ngModel)]="emailDate" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-[2rem] p-6 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all">
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Structural Group Vector</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 material-icons">filter_list</span>
                  <input type="text" [(ngModel)]="emailSubjectPattern" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-[2rem] pl-16 pr-6 py-6 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all" placeholder="e.g. Java Project Alpha">
                </div>
              </div>
            </div>

            <div *ngIf="emailFetching" class="p-10 rounded-[2.5rem] bg-primary-500/5 border border-primary-500/10 flex flex-col items-center justify-center gap-6 animate-pulse">
               <div class="relative w-16 h-16">
                 <div class="absolute inset-0 border-4 border-primary-500/10 rounded-full"></div>
                 <div class="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
               </div>
               <p class="text-[9px] font-black text-primary-500 uppercase tracking-[0.4em]">Decoding Communication Stream</p>
            </div>
          </div>

          <div class="px-10 py-10 bg-slate-50/50 dark:bg-white/[0.01] flex justify-end gap-6 items-center">
            <button (click)="showEmailModal = false" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Abort</button>
            <button (click)="fetchFromEmail()" [disabled]="emailFetching" class="px-14 py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.4em] shadow-4xl hover:scale-105 active:scale-95 transition-all">
              {{ emailFetching ? 'Processing Matrix...' : 'Commit Extraction' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Structural Analysis Modal (Manual) -->
      <div *ngIf="showProcessModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-fade-in">
        <div class="glass-card w-full max-w-3xl p-0 overflow-hidden ring-1 ring-white/10 shadow-5xl animate-zoom-in border-0 rounded-[3rem]">
          <div class="px-12 py-12 bg-primary-600 text-white relative overflow-hidden">
            <div class="relative z-10">
              <h3 class="text-3xl font-black font-manrope tracking-tight leading-none mb-2">Structural Synthesis</h3>
              <p class="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Direct Communication Processing Matrix</p>
            </div>
            <div class="absolute top-0 right-0 p-10 opacity-10 blur-sm">
               <span class="material-icons text-[150px]">data_array</span>
            </div>
          </div>
          
          <div class="p-12 space-y-10 bg-white dark:bg-slate-950">
            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Target Temporal Point</label>
              <input type="date" [(ngModel)]="processDate" class="w-full bg-slate-50 dark:bg-white/5 border-0 rounded-[2rem] p-6 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 shadow-inner transition-all"/>
            </div>
            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Raw Communication Payload</label>
              <textarea [(ngModel)]="chatText" rows="12" class="w-full bg-slate-900 p-10 rounded-[3rem] text-primary-400 font-mono text-xs leading-loose border-0 focus:ring-4 focus:ring-primary-500/20 custom-scrollbar resize-none shadow-2xl" placeholder="Inject raw communication data here for structural decomposition..."></textarea>
            </div>
          </div>
          
          <div class="px-12 py-10 bg-slate-50/50 dark:bg-white/[0.01] flex justify-end gap-6 items-center">
            <button (click)="showProcessModal = false" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Discard</button>
            <button (click)="processChat()" [disabled]="!chatText" class="px-14 py-6 rounded-[2rem] bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-4xl hover:scale-105 active:scale-95 transition-all">
              Initialize Synthesis
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
    
    .badge-wfo { @apply bg-emerald-500/10 text-emerald-600 border-emerald-500/20; }
    .badge-wfh { @apply bg-indigo-500/10 text-indigo-600 border-indigo-500/20; }
    .badge-leave { @apply bg-rose-500/10 text-rose-600 border-rose-500/20; }
    .badge-holiday { @apply bg-amber-500/10 text-amber-600 border-amber-500/20; }
    .badge-absent { @apply bg-slate-500/10 text-slate-600 border-slate-500/20; }
    .badge-bench { @apply bg-blue-500/10 text-blue-600 border-blue-500/20; }
    .badge-training { @apply bg-purple-500/10 text-purple-600 border-purple-500/20; }
    .badge { @apply bg-slate-100 text-slate-500 border-slate-200; }
  `]
})
export class AttendanceComponent implements OnInit {
  attendance: Attendance[] = [];
  isLoading = true;
  selectedDate = new Date().toISOString().split('T')[0];

  emptyStateOptions: AnimationOptions = {
    path: 'https://assets10.lottiefiles.com/packages/lf20_chf3tt1b.json',
  };
  activeFilter = 'ALL';
  showProcessModal = false;
  chatText = '';
  processDate = new Date().toISOString().split('T')[0];

  // Email fetch
  showEmailModal = false;
  gmailEmail = '';
  gmailPassword = '';
  emailDate = new Date().toISOString().split('T')[0];
  emailSubjectPattern = 'WhatsApp Chat with Java Team';
  emailMessage = '';
  emailSuccess = false;
  emailPreview = '';
  emailFetching = false;
  automationConfigured = false;
  oauthConnected = false;

  filters = [
    { label: 'All', value: 'ALL' },
    { label: 'WFO', value: 'WFO' },
    { label: 'WFH', value: 'WFH' },
    { label: 'Leave', value: 'LEAVE' },
    { label: 'Holiday', value: 'HOLIDAY' },
    { label: 'Absent', value: 'ABSENT' },
    { label: 'Bench', value: 'BENCH' },
    { label: 'Training', value: 'TRAINING' },
  ];

  constructor(private api: ApiService, public authService: AuthService, public cdr: ChangeDetectorRef) { }

  trackByAttendanceId(index: number, item: Attendance): number { return item.id; }
  trackByFilterLabel(index: number, item: any): string { return item.label; }

  ngOnInit() {
    this.loadAttendance();
    // BUG-010 fix: only MANAGER+ need OAuth/App Password status — prevents silent 403s for TEAM_LEAD/USER
    if (this.authService.isManager) {
      this.checkAutomationStatus();
    }
    this.cdr.markForCheck();
  }

  checkAutomationStatus() {
    // Check OAuth2 first (preferred)
    this.api.getGmailOAuthStatus().subscribe({
      next: (status) => {
        if (status?.connected) {
          this.oauthConnected = true;
          this.automationConfigured = true;
          this.gmailEmail = status.email;
          this.cdr.markForCheck();
        } else {
          // Fall back to checking App Password credentials
          this.api.getGmailStatus().subscribe({
            next: (s) => {
              this.automationConfigured = s.configured;
              if (s.configured) this.gmailEmail = s.email;
              this.cdr.markForCheck();
            }
          });
        }
      },
      error: () => {
        // Fall back to App Password status
        this.api.getGmailStatus().subscribe({
          next: (s) => {
            this.automationConfigured = s.configured;
            if (s.configured) this.gmailEmail = s.email;
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  loadAttendance() {
    this.isLoading = true;
    this.attendance = []; // Clear current records while loading
    this.cdr.markForCheck();
    this.api.getAttendanceByDate(this.selectedDate).subscribe({
      next: (data) => {
        this.attendance = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.attendance = [];
        this.cdr.markForCheck();
      }
    });
  }

  get filteredAttendance() {
    if (this.activeFilter === 'ALL') return this.attendance;
    return this.attendance.filter(a => a.status === this.activeFilter);
  }

  getCount(filter: string): number {
    if (filter === 'ALL') return this.attendance.length;
    return this.attendance.filter(a => a.status === filter).length;
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'WFO': 'badge-wfo', 'WFH': 'badge-wfh', 'LEAVE': 'badge-leave',
      'HOLIDAY': 'badge-holiday', 'ABSENT': 'badge-absent',
      'BENCH': 'badge-bench', 'TRAINING': 'badge-training'
    };
    return map[status] || 'badge';
  }

  processChat() {
    this.api.processAttendance(this.chatText, this.processDate).subscribe({
      next: (data) => {
        this.attendance = data;
        this.showProcessModal = false;
        this.chatText = '';
        this.selectedDate = this.processDate;
        this.cdr.markForCheck();
      }
    });
  }

  fetchFromEmail() {
    this.emailFetching = true;
    this.emailMessage = '';
    this.emailPreview = '';
    this.cdr.markForCheck();

    this.api.processAttendanceFromEmail(this.emailDate, this.gmailEmail, this.gmailPassword, this.emailSubjectPattern).subscribe({
      next: (response) => {
        this.emailFetching = false;
        this.showEmailModal = false;
        this.emailSuccess = response.success;
        this.emailMessage = response.message;

        if (response.success && response.attendance) {
          this.attendance = response.attendance;
          this.selectedDate = this.emailDate;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.emailFetching = false;
        this.showEmailModal = false;
        this.emailSuccess = false;
        this.emailMessage = err.error?.message || 'Failed to fetch email. Check Gmail IMAP settings.';
        this.cdr.markForCheck();
      }
    });
  }
}
