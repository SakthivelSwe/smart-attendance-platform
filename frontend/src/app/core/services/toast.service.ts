import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private toasts$ = new BehaviorSubject<Toast[]>([]);
    private counter = 0;

    get toasts() {
        return this.toasts$.asObservable();
    }

    success(message: string, duration = 4000) {
        this.show(message, 'success', duration);
    }

    error(message: string, duration = 6000) {
        this.show(message, 'error', duration);
    }

    warning(message: string, duration = 5000) {
        this.show(message, 'warning', duration);
    }

    info(message: string, duration = 4000) {
        this.show(message, 'info', duration);
    }

    private show(message: string, type: Toast['type'], duration: number) {
        const id = ++this.counter;
        const toast: Toast = { id, message, type, duration };
        const current = this.toasts$.value;
        this.toasts$.next([...current, toast]);

        setTimeout(() => this.dismiss(id), duration);
    }

    dismiss(id: number) {
        const current = this.toasts$.value.filter(t => t.id !== id);
        this.toasts$.next(current);
    }
}
