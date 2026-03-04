import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/interfaces';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn) {
        return true;
    }
    router.navigate(['/login']);
    return false;
};

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn && authService.isAdmin) {
        return true;
    }
    router.navigate(['/dashboard']);
    return false;
};

/**
 * Guard that requires at least MANAGER role (ADMIN or MANAGER).
 */
export const managerGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn && authService.hasMinRole('MANAGER')) {
        return true;
    }
    router.navigate(['/dashboard']);
    return false;
};

/**
 * Guard that requires at least TEAM_LEAD role (ADMIN, MANAGER, or TEAM_LEAD).
 */
export const teamLeadGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn && authService.hasMinRole('TEAM_LEAD')) {
        return true;
    }
    router.navigate(['/dashboard']);
    return false;
};

/**
 * Factory function to create a guard for a specific minimum role.
 * Usage in routes: canActivate: [roleGuard('MANAGER')]
 */
export function roleGuard(requiredRole: UserRole): CanActivateFn {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        if (authService.isLoggedIn && authService.hasMinRole(requiredRole)) {
            return true;
        }
        router.navigate(['/dashboard']);
        return false;
    };
}
