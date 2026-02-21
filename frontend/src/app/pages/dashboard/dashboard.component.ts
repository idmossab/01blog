import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Blog, UserResponse } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  user: UserResponse | null = null;
  users: UserResponse[] = [];
  posts: Blog[] = [];
  reportsCount = 0;
  userPostsCount: Record<number, number> = {};
  followerCountByUser: Record<number, number> = {};

  tab: 'users' | 'posts' | 'reports' = 'users';
  search = '';
  loading = true;
  error = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.getToken()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.api.getMe().subscribe({
      next: (me) => {
        if (me.role !== 'ADMIN') {
          this.router.navigateByUrl('/home');
          return;
        }
        this.user = me;
        this.auth.setCurrentUser(me);
        this.loadDashboard();
      },
      error: () => this.router.navigateByUrl('/home')
    });
  }

  private loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.api.getAdminUsers().subscribe({
      next: (users) => {
        this.users = users || [];
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load users';
        this.loading = false;
      }
    });

    this.api.getAdminPosts().subscribe({
      next: (posts) => {
        this.posts = posts || [];
        this.recomputeUserPostCounts();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load posts';
        this.loading = false;
      }
    });

    this.api.getAdminFollowersCounts().subscribe({
      next: (items) => {
        const map: Record<number, number> = {};
        for (const item of items || []) {
          map[item.userId] = item.count;
        }
        this.followerCountByUser = map;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load followers counts';
        this.loading = false;
      }
    });

    this.api.getAdminReportsCount().subscribe({
      next: (res) => (this.reportsCount = res?.count || 0),
      error: () => (this.reportsCount = 0)
    });
  }

  private recomputeUserPostCounts(): void {
    const map: Record<number, number> = {};
    for (const post of this.posts) {
      const uid = post.userId;
      if (!uid) continue;
      map[uid] = (map[uid] || 0) + 1;
    }
    this.userPostsCount = map;
  }

  get filteredUsers(): UserResponse[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.users;
    return this.users.filter((u) => {
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      const username = u.userName.toLowerCase();
      const email = u.email.toLowerCase();
      return name.includes(term) || username.includes(term) || email.includes(term);
    });
  }

  openProfile(userId: number): void {
    this.router.navigateByUrl(`/profile/${userId}`);
  }

  private getSuperAdminId(): number | null {
    const adminIds = this.users
      .filter((u) => u.role === 'ADMIN')
      .map((u) => u.userId);
    if (!adminIds.length) return null;
    return Math.min(...adminIds);
  }

  canChangeRole(target: UserResponse): boolean {
    if (!this.user) return false;
    const superAdminId = this.getSuperAdminId();
    if (superAdminId !== null && target.userId === superAdminId) return false;
    return true;
  }

  toggleUserRole(target: UserResponse): void {
    if (!this.canChangeRole(target)) return;

    const nextRole = target.role === 'ADMIN' ? 'USER' : 'ADMIN';
    this.api.updateAdminUserRole(target.userId, nextRole).subscribe({
      next: (updated) => {
        this.users = this.users.map((u) => (u.userId === updated.userId ? updated : u));
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to update user role';
      }
    });
  }

  toggleUserStatus(target: UserResponse): void {
    if (!this.user || target.role === 'ADMIN' || target.userId === this.user.userId) return;

    const nextStatus = target.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    this.api.updateAdminUserStatus(target.userId, nextStatus).subscribe({
      next: (updated) => {
        this.users = this.users.map((u) => (u.userId === updated.userId ? updated : u));
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to update user status';
      }
    });
  }

  deleteUser(target: UserResponse): void {
    if (!this.user || target.role === 'ADMIN' || target.userId === this.user.userId) return;
    const confirmed = window.confirm(`Delete user "${target.userName}"? This action cannot be undone.`);
    if (!confirmed) return;

    this.api.deleteUser(target.userId).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.userId !== target.userId);
        delete this.userPostsCount[target.userId];
        delete this.followerCountByUser[target.userId];
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to delete user';
      }
    });
  }
}
