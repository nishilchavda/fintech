import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Auth } from '@angular/fire/auth';
import { NgIf, NgClass } from '@angular/common';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [NgIf, NgClass],
    templateUrl: './settings.html',
    styleUrl: './settings.css'
})
export class Settings implements OnInit {

    isDark = true;
    userEmail = '';
    successMessage = '';

    constructor(
        private themeService: ThemeService,
        private auth: Auth
    ) { }

    ngOnInit() {
        this.isDark = this.themeService.isDark;
        this.userEmail = this.auth.currentUser?.email || 'Not logged in';
    }

    toggleTheme() {
        this.themeService.toggle();
        this.isDark = this.themeService.isDark;
        this.showSuccess(this.isDark ? 'Switched to dark mode' : 'Switched to light mode');
    }

    setDark() {
        this.themeService.setDark();
        this.isDark = true;
        this.showSuccess('Switched to dark mode');
    }

    setLight() {
        this.themeService.setLight();
        this.isDark = false;
        this.showSuccess('Switched to light mode');
    }

    private showSuccess(message: string) {
        this.successMessage = message;
        setTimeout(() => {
            this.successMessage = '';
        }, 2000);
    }
}
