import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Blog, FollowCounts, UserResponse } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: UserResponse | null = null;
  blogs: Blog[] = [];
  blogCount = 0;
  followCounts: FollowCounts = { following: 0, followers: 0 };
  loading = true;
  error = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const cached = this.auth.getCurrentUser();
    this.user = cached;
    if (!cached) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading = true;
    this.api.getMe().subscribe({
      next: (me) => {
        this.user = me;
        this.auth.setCurrentUser(me);
        this.loadCounts();
        this.loadBlogs();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  private loadCounts(): void {
    this.api.getMyFollowCounts().subscribe({
      next: (counts) => (this.followCounts = counts),
      error: () => {}
    });

    this.api.getMyBlogCount().subscribe({
      next: (data) => (this.blogCount = data.count || 0),
      error: () => {}
    });
  }

  private loadBlogs(): void {
    this.api.getMyBlogs(0, 10).subscribe({
      next: (data) => {
        this.blogs = data?.content || data || [];
        if (!this.blogCount) {
          this.blogCount = data?.totalElements || this.blogs.length;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load blogs';
        this.loading = false;
      }
    });
  }

  formatRelative(dateValue?: string): string {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const now = Date.now();
    const diffMs = Math.max(0, now - date.getTime());
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
}
