import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <div *ngFor="let toast of toasts"
           class="pointer-events-auto rounded-2xl shadow-elevated border backdrop-blur-xl p-4 flex items-start gap-3 animate-slide-in-right transition-all duration-300 relative overflow-hidden"
           [ngClass]="{
             'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-200/60 dark:border-emerald-800/40': toast.type === 'success',
             'bg-rose-50/90 dark:bg-rose-950/80 border-rose-200/60 dark:border-rose-800/40': toast.type === 'error',
             'bg-amber-50/90 dark:bg-amber-950/80 border-amber-200/60 dark:border-amber-800/40': toast.type === 'warning',
             'bg-sky-50/90 dark:bg-sky-950/80 border-sky-200/60 dark:border-sky-800/40': toast.type === 'info'
           }">
        <!-- Color accent bar -->
        <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
             [ngClass]="{
               'bg-emerald-500': toast.type === 'success',
               'bg-rose-500': toast.type === 'error',
               'bg-amber-500': toast.type === 'warning',
               'bg-sky-500': toast.type === 'info'
             }"></div>
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5 ml-1.5"
             [ngClass]="{
               'text-emerald-600 dark:text-emerald-400': toast.type === 'success',
               'text-rose-600 dark:text-rose-400': toast.type === 'error',
               'text-amber-600 dark:text-amber-400': toast.type === 'warning',
               'text-sky-600 dark:text-sky-400': toast.type === 'info'
             }">
          <svg *ngIf="toast.type === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <svg *ngIf="toast.type === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <svg *ngIf="toast.type === 'warning'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <svg *ngIf="toast.type === 'info'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <!-- Message -->
        <p class="text-sm font-semibold flex-1 font-sans"
           [ngClass]="{
             'text-emerald-800 dark:text-emerald-200': toast.type === 'success',
             'text-rose-800 dark:text-rose-200': toast.type === 'error',
             'text-amber-800 dark:text-amber-200': toast.type === 'warning',
             'text-sky-800 dark:text-sky-200': toast.type === 'info'
           }">{{ toast.message }}</p>
        <!-- Dismiss -->
        <button (click)="dismiss(toast.id)" class="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                [ngClass]="{
                  'text-emerald-700 dark:text-emerald-300': toast.type === 'success',
                  'text-rose-700 dark:text-rose-300': toast.type === 'error',
                  'text-amber-700 dark:text-amber-300': toast.type === 'warning',
                  'text-sky-700 dark:text-sky-300': toast.type === 'info'
                }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
    toasts: Toast[] = [];

    constructor(private toastService: ToastService) {
        this.toastService.toasts.subscribe(t => this.toasts = t);
    }

    dismiss(id: number) {
        this.toastService.dismiss(id);
    }
}
