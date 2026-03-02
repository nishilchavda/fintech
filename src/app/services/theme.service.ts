import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly STORAGE_KEY = 'vault-theme';

    constructor() {
        this.loadTheme();
    }

    get isDark(): boolean {
        return !document.documentElement.classList.contains('light');
    }

    toggle() {
        if (this.isDark) {
            this.setLight();
        } else {
            this.setDark();
        }
    }

    setDark() {
        document.documentElement.classList.remove('light');
        localStorage.setItem(this.STORAGE_KEY, 'dark');
    }

    setLight() {
        document.documentElement.classList.add('light');
        localStorage.setItem(this.STORAGE_KEY, 'light');
    }

    private loadTheme() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved === 'light') {
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
        }
    }
}
