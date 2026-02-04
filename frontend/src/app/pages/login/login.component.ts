import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  emailOrUsername = '';
  password = '';
  error = '';
  loading = false;

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  submit(): void {
    this.error = '';
    this.loading = true;
    this.api.login({ emailOrUsername: this.emailOrUsername, password: this.password }).subscribe({
      next: (user) => {
        this.auth.setCurrentUser(user);
        this.router.navigateByUrl('/home');
      },
      error: (err) => {
        this.error = err?.error || 'Login failed';
        this.loading = false;
      }
    });
  }
}
