import { Injectable } from '@angular/core';

import { UserResponse } from './models';

const USER_KEY = 'currentUser';
const TOKEN_KEY = 'authToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  getCurrentUser(): UserResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserResponse) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setSession(user: UserResponse, token: string): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearSession(): void {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  setCurrentUser(user: UserResponse | null): void {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  logout(): void {
    this.clearSession();
  }
}
