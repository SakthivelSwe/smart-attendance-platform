import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface ImportRecord {
  senderName: string;
  resolvedPhone: string;
  employeeId: number | null;
  employeeName: string | null;
  employeeCode: string | null;
  date: string;
  inTime: string | null;
  outTime: string | null;
  wfh: boolean;
  status: string;
  matched: boolean;
  matchMethod: string | null;
  selected: boolean;
}

@Component({
  selector: 'app-import-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-header">📥 Import Attendance</h1>
          <p class="page-subtitle">Import attendance from WhatsApp group chat export</p>
        </div>
      </div>

      <!-- Alert Banner -->
      <div *ngIf="alertMsg" class="mb-5 p-4 rounded-xl text-sm flex items-start gap-3"
           [ngClass]="alertSuccess ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                   : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40'">
        <span class="text-lg">{{ alertSuccess ? '✅' : '⚠️' }}</span>
        <p class="flex-1 font-medium">{{ alertMsg }}</p>
        <button (click)="alertMsg = ''" class="ml-auto opacity-60 hover:opacity-100 text-lg leading-none">×</button>
      </div>

      <!-- Two-column layout: Setup + Import -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- LEFT: Setup Card (VCF) -->
        <div class="lg:col-span-1">
          <div class="glass-card p-6 h-full">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md">
                📱
              </div>
              <div>
                <h2 class="font-semibold text-[var(--text-primary)]">Contact Map Setup</h2>
                <p class="text-xs text-[var(--text-secondary)]">One-time setup only</p>
              </div>
            </div>

            <!-- VCF Status Badge -->
            <div class="mb-4 p-3 rounded-xl flex items-center gap-2"
                 [ngClass]="vcfLoaded
                   ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40'
                   : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40'">
              <span class="text-lg">{{ vcfLoaded ? '✅' : '⏳' }}</span>
              <div>
                <p class="text-xs font-semibold" [ngClass]="vcfLoaded ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'">
                  {{ vcfLoaded ? 'Contact Map Loaded' : 'Setup Required' }}
                </p>
                <p class="text-xs" [ngClass]="vcfLoaded ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'">
                  {{ vcfContactCount > 0 ? vcfContactCount + ' employee contacts stored' : 'Upload contacts.vcf to begin' }}
                </p>
                <p *ngIf="vcfDiscarded > 0" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  🛡️ {{ vcfDiscarded }} personal contacts discarded
                </p>
              </div>
            </div>

            <!-- Group Selector -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Attendance Group</label>
              <select [(ngModel)]="selectedGroupId" (change)="onGroupChange()" class="input-field">
                <option [ngValue]="null" disabled>Select group...</option>
                <option *ngFor="let g of groups" [ngValue]="g.id">{{ g.name }}</option>
              </select>
            </div>

            <!-- VCF Upload -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Upload contacts.vcf
                <span class="ml-1 text-xs opacity-60">(one-time)</span>
              </label>
              <div class="relative border-2 border-dashed rounded-xl p-4 text-center transition-colors"
                   [ngClass]="vcfDragOver
                     ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                     : 'border-[var(--border-color)] hover:border-blue-300'"
                   (dragover)="vcfDragOver = true; $event.preventDefault()"
                   (dragleave)="vcfDragOver = false"
                   (drop)="onVcfDrop($event)">
                <div class="flex flex-col items-center gap-2">
                  <span class="text-2xl">📁</span>
                  <p class="text-xs text-[var(--text-secondary)]">Drag & drop .vcf file or</p>
                  <label class="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Browse file
                    <input type="file" accept=".vcf" class="hidden" (change)="onVcfFileSelected($event)">
                  </label>
                  <p *ngIf="vcfFileName" class="text-xs text-emerald-600 font-medium mt-1">📎 {{ vcfFileName }}</p>
                </div>
              </div>
            </div>

            <!-- Privacy notice -->
            <div class="mb-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-400">
              🔒 <strong>Privacy:</strong> Only contacts matching your team's employees are stored. Personal contacts (family, friends) are discarded immediately and never saved.
            </div>

            <button (click)="uploadVcf()" [disabled]="!vcfFile || !selectedGroupId || vcfUploading"
                    class="btn-primary w-full">
              <span class="flex items-center justify-center gap-2">
                <svg *ngIf="vcfUploading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {{ vcfUploading ? 'Uploading...' : (vcfLoaded ? '🔄 Update Contact Map' : '⬆️ Upload Contact Map') }}
              </span>
            </button>

            <!-- Instructions -->
            <details class="mt-4">
              <summary class="text-xs font-medium text-[var(--text-secondary)] cursor-pointer hover:text-primary-500 transition-colors">
                📖 How to export contacts.vcf?
              </summary>
              <div class="mt-2 text-xs text-[var(--text-secondary)] space-y-1 pl-2 border-l-2 border-blue-200">
                <p>1. Open <strong>Contacts App</strong> on Android</p>
                <p>2. Tap ⋮ Menu → <strong>Export</strong></p>
                <p>3. Save as <strong>contacts.vcf</strong></p>
                <p>4. Email it to yourself & upload here</p>
                <p class="text-emerald-600 font-medium">✅ Do this only once!</p>
              </div>
            </details>
          </div>
        </div>

        <!-- RIGHT: WhatsApp Import -->
        <div class="lg:col-span-2">
          <div class="glass-card p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-lg shadow-md">
                💬
              </div>
              <div>
                <h2 class="font-semibold text-[var(--text-primary)]">Upload WhatsApp Chat Export</h2>
                <p class="text-xs text-[var(--text-secondary)]">Do this every time</p>
              </div>
            </div>

            <!-- Chat File Drop Zone -->
            <div class="mb-4 relative border-2 border-dashed rounded-xl p-6 text-center transition-colors"
                 [ngClass]="chatDragOver
                   ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                   : 'border-[var(--border-color)] hover:border-green-300'"
                 (dragover)="chatDragOver = true; $event.preventDefault()"
                 (dragleave)="chatDragOver = false"
                 (drop)="onChatDrop($event)">
              <div class="flex flex-col items-center gap-2">
                <span class="text-3xl">💬</span>
                <p class="text-sm font-medium text-[var(--text-primary)]">WhatsApp Export (.txt)</p>
                <p class="text-xs text-[var(--text-secondary)]">Drag & drop the exported WhatsApp chat file, or</p>
                <label class="cursor-pointer text-sm font-semibold text-green-600 hover:text-green-700 transition-colors">
                  Browse file
                  <input type="file" accept=".txt" class="hidden" (change)="onChatFileSelected($event)">
                </label>
                <p *ngIf="chatFileName" class="text-xs text-emerald-600 font-medium mt-1">📎 {{ chatFileName }}</p>
              </div>
            </div>

            <button (click)="previewImport()" [disabled]="!chatFile || !selectedGroupId || importing"
                    class="btn-primary w-full mb-2">
              <span class="flex items-center justify-center gap-2">
                <svg *ngIf="importing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {{ importing ? 'Processing...' : '🔍 Preview & Resolve' }}
              </span>
            </button>

            <!-- Instructions -->
            <details>
              <summary class="text-xs font-medium text-[var(--text-secondary)] cursor-pointer hover:text-primary-500 transition-colors">
                📖 How to export WhatsApp chat?
              </summary>
              <div class="mt-2 text-xs text-[var(--text-secondary)] space-y-1 pl-2 border-l-2 border-green-200">
                <p>1. Open <strong>WhatsApp</strong> → Open attendance group</p>
                <p>2. Tap group name → <strong>Export Chat</strong></p>
                <p>3. Choose <strong>Without Media</strong></p>
                <p>4. Email to yourself & upload here</p>
                <p class="text-blue-600 font-medium">🔁 Do this every day/week</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- Preview Results Table -->
      <div *ngIf="previewRecords.length > 0" class="mt-6 glass-card overflow-hidden border-0">
        <!-- Table Header -->
        <div class="px-6 py-4 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 class="font-semibold text-[var(--text-primary)]">Preview Results</h3>
            <p class="text-xs text-[var(--text-secondary)] mt-0.5">
              <span class="text-emerald-600 font-medium">{{ matchedCount }} matched</span>
              · <span class="text-amber-600 font-medium">{{ unmatchedCount }} unmatched</span>
              · <span class="text-blue-600 font-medium">{{ selectedCount }} selected</span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="selectAllMatched()" class="text-xs btn-secondary py-1.5 px-3">
              ✅ Select All Matched
            </button>
            <button (click)="confirmImport()" [disabled]="selectedCount === 0 || saving"
                    class="btn-primary py-2 px-4">
              <span class="flex items-center gap-2">
                <svg *ngIf="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {{ saving ? 'Saving...' : '💾 Save ' + selectedCount + ' Records' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex gap-2 px-6 py-3 border-b border-[var(--border-color)] bg-white/30 dark:bg-surface-800/30">
          <button *ngFor="let f of previewFilters" (click)="previewFilter = f.value"
                  class="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  [ngClass]="previewFilter === f.value
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white dark:bg-surface-800 text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-gray-50'">
            {{ f.label }} ({{ getPreviewCount(f.value) }})
          </button>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-white/50 dark:bg-surface-800/40 border-b border-[var(--border-color)]">
                <th class="px-4 py-3 text-left">
                  <input type="checkbox" (change)="toggleAll($event)" class="rounded">
                </th>
                <th class="px-4 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">WhatsApp Name</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Phone</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Employee</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">In</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Out</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Match</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)]">
              <tr *ngFor="let r of filteredPreview" class="group hover:bg-white/40 dark:hover:bg-surface-700/40 transition-all">
                <td class="px-4 py-3">
                  <input type="checkbox" [(ngModel)]="r.selected" [disabled]="!r.matched" class="rounded">
                </td>
                <td class="px-4 py-3">
                  <span class="text-sm font-medium text-[var(--text-primary)]">{{ r.senderName }}</span>
                </td>
                <td class="px-4 py-3 text-xs font-mono text-[var(--text-secondary)]">
                  {{ r.resolvedPhone || '—' }}
                </td>
                <td class="px-4 py-3">
                  <div *ngIf="r.matched" class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      {{ r.employeeName?.charAt(0) }}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-[var(--text-primary)]">{{ r.employeeName }}</p>
                      <p class="text-xs text-[var(--text-secondary)] font-mono">{{ r.employeeCode }}</p>
                    </div>
                  </div>
                  <span *ngIf="!r.matched" class="text-xs text-amber-600 font-medium">⚠️ Unmatched</span>
                </td>
                <td class="px-4 py-3 text-sm text-[var(--text-secondary)]">{{ r.date }}</td>
                <td class="px-4 py-3 text-sm font-medium text-emerald-600">{{ r.inTime || '—' }}</td>
                <td class="px-4 py-3 text-sm font-medium text-blue-600">{{ r.outTime || '—' }}</td>
                <td class="px-4 py-3">
                  <span *ngIf="r.matched" class="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {{ getMatchLabel(r.matchMethod) }}
                  </span>
                  <span *ngIf="!r.matched" class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    No match
                  </span>
                </td>
              </tr>
              <tr *ngIf="filteredPreview.length === 0">
                <td colspan="8" class="px-6 py-8 text-center text-[var(--text-secondary)] text-sm">
                  No records match the current filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ImportAttendanceComponent implements OnInit {
  groups: any[] = [];
  selectedGroupId: number | null = null;

  // VCF state
  vcfFile: File | null = null;
  vcfFileName = '';
  vcfDragOver = false;
  vcfUploading = false;
  vcfLoaded = false;
  vcfContactCount = 0;
  vcfDiscarded = 0;  // Personal contacts filtered out (never stored)

  // Chat import state
  chatFile: File | null = null;
  chatFileName = '';
  chatDragOver = false;
  importing = false;

  // Preview state
  previewRecords: ImportRecord[] = [];
  previewFilter = 'ALL';
  saving = false;

  // Alert
  alertMsg = '';
  alertSuccess = false;

  previewFilters = [
    { label: 'All', value: 'ALL' },
    { label: 'Matched', value: 'MATCHED' },
    { label: 'Unmatched', value: 'UNMATCHED' },
  ];

  constructor(private api: ApiService, public authService: AuthService) { }

  ngOnInit() {
    this.api.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        if (groups.length === 1) {
          this.selectedGroupId = groups[0].id;
          this.checkVcfStatus();
        }
      }
    });
  }

  onGroupChange() {
    if (this.selectedGroupId) {
      this.checkVcfStatus();
      this.previewRecords = [];
    }
  }

  checkVcfStatus() {
    if (!this.selectedGroupId) return;
    this.api.getVcfStatus(this.selectedGroupId).subscribe({
      next: (res) => {
        this.vcfLoaded = res.loaded;
        this.vcfContactCount = res.contactCount;
      }
    });
  }

  // --- VCF File Handling ---
  onVcfFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) { this.vcfFile = file; this.vcfFileName = file.name; }
  }

  onVcfDrop(event: DragEvent) {
    event.preventDefault();
    this.vcfDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.vcf')) {
      this.vcfFile = file;
      this.vcfFileName = file.name;
    } else {
      this.showAlert('Please drop a .vcf file.', false);
    }
  }

  uploadVcf() {
    if (!this.vcfFile || !this.selectedGroupId) return;
    this.vcfUploading = true;
    this.api.uploadVcf(this.vcfFile, this.selectedGroupId).subscribe({
      next: (res) => {
        this.vcfUploading = false;
        this.vcfLoaded = true;
        this.vcfContactCount = res.matched ?? res.contactsLoaded;
        this.vcfDiscarded = res.discarded ?? 0;
        this.vcfFile = null;
        this.vcfFileName = '';
        this.showAlert(res.message, true);
      },
      error: (err) => {
        this.vcfUploading = false;
        this.showAlert(err.error?.message || 'Failed to upload VCF file.', false);
      }
    });
  }

  // --- Chat File Handling ---
  onChatFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) { this.chatFile = file; this.chatFileName = file.name; }
  }

  onChatDrop(event: DragEvent) {
    event.preventDefault();
    this.chatDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.txt')) {
      this.chatFile = file;
      this.chatFileName = file.name;
    } else {
      this.showAlert('Please drop a .txt WhatsApp export file.', false);
    }
  }

  previewImport() {
    if (!this.chatFile || !this.selectedGroupId) return;
    this.importing = true;
    this.previewRecords = [];
    this.api.previewWhatsAppImport(this.chatFile, this.selectedGroupId).subscribe({
      next: (res) => {
        this.importing = false;
        this.previewRecords = (res.records || []).map((r: any) => ({ ...r, selected: r.matched }));
        this.showAlert(res.message, true);
      },
      error: (err) => {
        this.importing = false;
        this.showAlert(err.error?.message || 'Failed to preview import.', false);
      }
    });
  }

  confirmImport() {
    const selected = this.previewRecords.filter(r => r.selected && r.matched);
    if (selected.length === 0) return;
    this.saving = true;
    this.api.confirmWhatsAppImport(selected).subscribe({
      next: (res) => {
        this.saving = false;
        this.previewRecords = [];
        this.chatFile = null;
        this.chatFileName = '';
        this.showAlert(res.message, true);
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.message || 'Failed to save records.', false);
      }
    });
  }

  selectAllMatched() {
    this.previewRecords.forEach(r => { if (r.matched) r.selected = true; });
  }

  toggleAll(event: any) {
    const checked = event.target.checked;
    this.filteredPreview.forEach(r => { if (r.matched) r.selected = checked; });
  }

  get filteredPreview(): ImportRecord[] {
    if (this.previewFilter === 'MATCHED') return this.previewRecords.filter(r => r.matched);
    if (this.previewFilter === 'UNMATCHED') return this.previewRecords.filter(r => !r.matched);
    return this.previewRecords;
  }

  getPreviewCount(filter: string): number {
    if (filter === 'MATCHED') return this.previewRecords.filter(r => r.matched).length;
    if (filter === 'UNMATCHED') return this.previewRecords.filter(r => !r.matched).length;
    return this.previewRecords.length;
  }

  get matchedCount(): number { return this.previewRecords.filter(r => r.matched).length; }
  get unmatchedCount(): number { return this.previewRecords.filter(r => !r.matched).length; }
  get selectedCount(): number { return this.previewRecords.filter(r => r.selected && r.matched).length; }

  getMatchLabel(method: string | null): string {
    const labels: Record<string, string> = {
      'VCF_NAME': '📱 VCF',
      'PHONE': '📞 Phone',
      'WHATSAPP_NAME': '💬 WA Name',
      'EMPLOYEE_NAME': '👤 Name',
    };
    return method ? (labels[method] || method) : '—';
  }

  private showAlert(msg: string, success: boolean) {
    this.alertMsg = msg;
    this.alertSuccess = success;
    setTimeout(() => this.alertMsg = '', 6000);
  }
}
