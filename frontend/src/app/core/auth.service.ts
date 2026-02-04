import { Injectable } from '@angular/core';

import { UserResponse } from './models';

const STORAGE_KEY = 'currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  getCurrentUser(): UserResponse | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserResponse) : null;
  }

  setCurrentUser(user: UserResponse | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  logout(): void {
    this.setCurrentUser(null);
  }
}
