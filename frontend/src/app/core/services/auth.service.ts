import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/interfaces';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) {
        const stored = sessionStorage.getItem('user');
        if (stored) {
            this.currentUserSubject.next(JSON.parse(stored));
        }
    }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    get isLoggedIn(): boolean {
        return !!this.currentUser?.token;
    }

    get isAdmin(): boolean {
        return this.currentUser?.role === 'ADMIN';
    }

    get token(): string | null {
        return this.currentUser?.token || null;
    }

    loginWithGoogle(credential: string): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/auth/google`, { credential }).pipe(
            tap(user => {
                sessionStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
            })
        );
    }

    login(credentials: { email: string; password: string }): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/auth/login`, credentials).pipe(
            tap(user => {
                sessionStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
            })
        );
    }

    register(data: any): Observable<string> {
        return this.http.post(`${this.apiUrl}/auth/register`, data, { responseType: 'text' });
    }

    verifyEmail(token: string): Observable<string> {
        return this.http.get(`${this.apiUrl}/auth/verify?token=${token}`, { responseType: 'text' });
    }

    forgotPassword(email: string): Observable<string> {
        return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email }, { responseType: 'text' });
    }

    resetPassword(data: any): Observable<string> {
        return this.http.post(`${this.apiUrl}/auth/reset-password`, data, { responseType: 'text' });
    }

    resendVerification(email: string): Observable<string> {
        return this.http.post(`${this.apiUrl}/auth/resend-verification?email=${email}`, null, { responseType: 'text' });
    }

    getCurrentUser(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/auth/me`);
    }

    logout(): void {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('scheduler_popup_shown');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }
}
