import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email!: string;
  password!: string;

  constructor(private auth: AuthService, private router: Router) { }

  login() {
    this.auth.login(this.email, this.password).then(() => {
      this.router.navigate(['/dashboard']);
    }).catch((error) => {
      console.log(error);
    });
  }
}
