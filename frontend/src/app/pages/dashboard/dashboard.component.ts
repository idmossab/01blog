import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AdminReportItem, Blog, ReportReason, UserResponse } from '../../core/models';

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
  reports: AdminReportItem[] = [];
  reportsCount = 0;
  userPostsCount: Record<number, number> = {};
  followerCountByUser: Record<number, number> = {};

  tab: 'users' | 'posts' | 'reports' = 'users';
  search = '';
  reportReasonFilter: 'ALL' | ReportReason = 'ALL';
  loading = true;
  error = '';
  pendingDeleteUser: UserResponse | null = null;
  deleteUserLoading = false;
  pendingDeletePost: Blog | null = null;
  deletePostLoading = false;

  readonly reportReasonOptions: Array<{ value: ReportReason; label: string }> = [
    { value: 'HARASSMENT_BULLYING', label: 'Harassment / Bullying' },
    { value: 'SPAM_SCAM', label: 'Spam / Scam' },
    { value: 'HATE_SPEECH', label: 'Hate speech' },
    { value: 'VIOLENCE_THREATS', label: 'Violence / Threats' },
    { value: 'SEXUAL_CONTENT', label: 'Sexual content' },
    { value: 'COPYRIGHT_IP', label: 'Copyright / IP' },
    { value: 'OTHER', label: 'Other' }
  ];

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

    this.api.getAdminReports().subscribe({
      next: (reports) => {
        this.reports = reports || [];
        this.reportsCount = this.reports.length;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load reports';
      }
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

  openDeleteUserModal(target: UserResponse): void {
    if (!this.user || target.role === 'ADMIN' || target.userId === this.user.userId) return;
    this.pendingDeleteUser = target;
  }

  closeDeleteUserModal(): void {
    if (this.deleteUserLoading) return;
    this.pendingDeleteUser = null;
  }

  confirmDeleteUser(): void {
    const target = this.pendingDeleteUser;
    if (!target || this.deleteUserLoading) return;
    this.deleteUserLoading = true;

    this.api.deleteUser(target.userId).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.userId !== target.userId);
        delete this.userPostsCount[target.userId];
        delete this.followerCountByUser[target.userId];
        this.posts = this.posts.filter((p) => p.userId !== target.userId);
        this.recomputeUserPostCounts();
        this.reports = this.reports.filter((r) =>
          r.reporterUserId !== target.userId &&
          r.reportedUserId !== target.userId &&
          r.blogAuthorUserId !== target.userId
        );
        this.reportsCount = this.reports.length;
        this.pendingDeleteUser = null;
        this.deleteUserLoading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to delete user';
        this.deleteUserLoading = false;
      }
    });
  }

  get filteredReports(): AdminReportItem[] {
    if (this.reportReasonFilter === 'ALL') {
        return this.reports;
    }
    return this.reports.filter((r) => r.reason === this.reportReasonFilter);
  }

  formatReason(reason?: ReportReason): string {
    if (!reason) return 'unknown';
    return reason.toLowerCase().replace(/_/g, ' ');
  }

  deleteReportedPost(report: AdminReportItem): void {
    if (!report.blogId) return;
    const confirmed = window.confirm('Delete this reported post?');
    if (!confirmed) return;

    this.api.deleteBlog(report.blogId).subscribe({
      next: () => {
        this.posts = this.posts.filter((p) => p.idBlog !== report.blogId);
        this.recomputeUserPostCounts();
        this.reports = this.reports.filter((r) => r.blogId !== report.blogId);
        this.reportsCount = this.reports.length;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to delete reported post';
      }
    });
  }

  openDeletePostModal(post: Blog): void {
    if (!post?.idBlog) return;
    this.pendingDeletePost = post;
  }

  closeDeletePostModal(): void {
    if (this.deletePostLoading) return;
    this.pendingDeletePost = null;
  }

  confirmDeletePost(): void {
    const post = this.pendingDeletePost;
    if (!post?.idBlog || this.deletePostLoading) return;
    this.deletePostLoading = true;

    this.api.deleteBlog(post.idBlog).subscribe({
      next: () => {
        this.posts = this.posts.filter((p) => p.idBlog !== post.idBlog);
        this.recomputeUserPostCounts();
        this.reports = this.reports.filter((r) => r.blogId !== post.idBlog);
        this.reportsCount = this.reports.length;
        this.pendingDeletePost = null;
        this.deletePostLoading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to delete post';
        this.deletePostLoading = false;
      }
    });
  }

  togglePostStatus(post: Blog): void {
    if (!post?.idBlog) return;
    const currentStatus = post.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE';
    const nextStatus: 'ACTIVE' | 'HIDDEN' = currentStatus === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';

    this.api.updateAdminPostStatus(post.idBlog, nextStatus).subscribe({
      next: (updated) => {
        this.posts = this.posts.map((p) => (p.idBlog === updated.idBlog ? updated : p));
        this.recomputeUserPostCounts();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to update post status';
      }
    });
  }
}
