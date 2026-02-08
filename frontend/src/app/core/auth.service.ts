import { Injectable } from '@angular/core';

import { UserResponse } from './models';

const TOKEN_KEY = 'authToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: UserResponse | null = null;

  getCurrentUser(): UserResponse | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setSession(user: UserResponse, token: string): void {
    this.currentUser = user;
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearSession(): void {
    this.currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  setCurrentUser(user: UserResponse | null): void {
    this.currentUser = user;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.clearSession();
  }
}
