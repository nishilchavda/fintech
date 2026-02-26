import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private auth: AuthService, private router: Router) { }

  register() {
    this.errorMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;
    this.auth.register(this.email, this.password).then(() => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }).catch((error) => {
      this.isLoading = false;
      if (error.code === 'auth/email-already-in-use') {
        this.errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        this.errorMessage = 'Please enter a valid email address.';
      } else {
        this.errorMessage = 'Registration failed. Please try again.';
      }
      console.log(error);
    });
  }
}
