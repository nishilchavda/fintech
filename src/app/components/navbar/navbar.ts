import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  sidebarOpen = false;

  constructor(private auth: AuthService) { }

  logout() {
    this.auth.logout();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}