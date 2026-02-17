import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    return next(req).pipe(
        catchError(error => {
            if (error.status === 0) {
                toast.error('Unable to connect to server. Please check if backend is running.');
            } else if (error.status === 401) {
                authService.logout();
                toast.warning('Session expired. Please sign in again.');
            } else if (error.status === 403) {
                router.navigate(['/dashboard']);
                toast.error('Access denied. You do not have permission.');
            } else if (error.status === 404) {
                toast.warning('Requested resource not found.');
            } else if (error.status >= 500) {
                toast.error('Server error. Please try again later.');
            } else if (error.status >= 400) {
                const msg = error.error?.message || error.error?.error || 'Request failed.';
                toast.error(msg);
            }
            return throwError(() => error);
        })
    );
};
