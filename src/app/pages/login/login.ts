import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email!: string;
  password!: string;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private auth: AuthService, private router: Router) { }

  login() {
    this.errorMessage = '';
    this.isLoading = true;
    this.auth.login(this.email, this.password).then(() => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }).catch((error) => {
      this.isLoading = false;
      this.errorMessage = 'Invalid email or password. Please try again.';
      console.log(error);
    });
  }
}
