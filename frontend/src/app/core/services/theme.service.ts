import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private darkMode = new BehaviorSubject<boolean>(false);
    isDarkMode$ = this.darkMode.asObservable();

    constructor() {
        const saved = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = saved ? saved === 'true' : prefersDark;
        this.setDarkMode(isDark);
    }

    get isDark(): boolean {
        return this.darkMode.value;
    }

    toggleTheme(): void {
        this.setDarkMode(!this.darkMode.value);
    }

    private setDarkMode(isDark: boolean): void {
        this.darkMode.next(isDark);
        localStorage.setItem('darkMode', String(isDark));
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
}
