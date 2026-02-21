import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AdminReportItem, Blog, ReportReason, UserResponse } from '../../core/models';

type ConfirmActionType =
  | 'TOGGLE_USER_ROLE'
  | 'TOGGLE_USER_STATUS'
  | 'DELETE_USER'
  | 'TOGGLE_POST_STATUS'
  | 'DELETE_POST';

interface ConfirmPayload {
  user?: UserResponse;
  post?: Blog;
  report?: AdminReportItem;
  nextUserRole?: 'ADMIN' | 'USER';
  nextUserStatus?: 'ACTIVE' | 'BANNED';
  nextPostStatus?: 'ACTIVE' | 'HIDDEN';
}

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
  postAuthorFilter = 'ALL';
  reportReasonFilter: 'ALL' | ReportReason = 'ALL';
  loading = true;
  error = '';
  confirmActionType: ConfirmActionType | null = null;
  confirmPayload: ConfirmPayload | null = null;
  confirmTitle = '';
  confirmMessage = '';
  confirmButtonText = 'Confirm';
  confirmDanger = false;
  confirmActionLoading = false;

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
          this.router.navigateByUrl('/forbidden');
          return;
        }
        this.user = me;
        this.auth.setCurrentUser(me);
        this.loadDashboard();
      },
      error: () => this.router.navigateByUrl('/forbidden')
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
    this.openConfirmModal({
      type: 'TOGGLE_USER_ROLE',
      title: 'Change User Role',
      message: `Are you sure you want to change ${target.userName} role to ${nextRole}?`,
      confirmButtonText: 'Yes, Change',
      danger: false,
      payload: { user: target, nextUserRole: nextRole }
    });
  }

  toggleUserStatus(target: UserResponse): void {
    if (!this.user || target.role === 'ADMIN' || target.userId === this.user.userId) return;

    const nextStatus = target.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    this.openConfirmModal({
      type: 'TOGGLE_USER_STATUS',
      title: nextStatus === 'BANNED' ? 'Ban User' : 'Unban User',
      message: `Are you sure you want to ${nextStatus === 'BANNED' ? 'ban' : 'unban'} ${target.userName}?`,
      confirmButtonText: nextStatus === 'BANNED' ? 'Yes, Ban' : 'Yes, Unban',
      danger: nextStatus === 'BANNED',
      payload: { user: target, nextUserStatus: nextStatus }
    });
  }

  openDeleteUserModal(target: UserResponse): void {
    if (!this.user || target.role === 'ADMIN' || target.userId === this.user.userId) return;
    this.openConfirmModal({
      type: 'DELETE_USER',
      title: 'Delete User',
      message: `Are you sure you want to delete ${target.userName}? This action cannot be undone.`,
      confirmButtonText: 'Yes, Delete',
      danger: true,
      payload: { user: target }
    });
  }

  get filteredReports(): AdminReportItem[] {
    if (this.reportReasonFilter === 'ALL') {
        return this.reports;
    }
    return this.reports.filter((r) => r.reason === this.reportReasonFilter);
  }

  get postAuthorFilters(): Array<{ value: string; label: string }> {
    const byUserId = new Map<number, string>();
    for (const post of this.posts) {
      if (!post.userId) continue;
      if (!byUserId.has(post.userId)) {
        byUserId.set(post.userId, post.userName || `User ${post.userId}`);
      }
    }
    return Array.from(byUserId.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([userId, userName]) => ({ value: String(userId), label: userName }));
  }

  get filteredPosts(): Blog[] {
    if (this.postAuthorFilter === 'ALL') return this.posts;
    return this.posts.filter((post) => String(post.userId || '') === this.postAuthorFilter);
  }

  formatReason(reason?: ReportReason): string {
    if (!reason) return 'unknown';
    return reason.toLowerCase().replace(/_/g, ' ');
  }

  deleteReportedPost(report: AdminReportItem): void {
    if (!report.blogId) return;
    this.openConfirmModal({
      type: 'DELETE_POST',
      title: 'Delete Reported Post',
      message: 'Are you sure you want to delete this reported post? This action cannot be undone.',
      confirmButtonText: 'Yes, Delete',
      danger: true,
      payload: { report }
    });
  }

  openDeletePostModal(post: Blog): void {
    if (!post?.idBlog) return;
    this.openConfirmModal({
      type: 'DELETE_POST',
      title: 'Delete Post',
      message: `Are you sure you want to delete ${post.title}? This action cannot be undone.`,
      confirmButtonText: 'Yes, Delete',
      danger: true,
      payload: { post }
    });
  }

  togglePostStatus(post: Blog): void {
    if (!post?.idBlog) return;
    const currentStatus = post.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE';
    const nextStatus: 'ACTIVE' | 'HIDDEN' = currentStatus === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
    this.openConfirmModal({
      type: 'TOGGLE_POST_STATUS',
      title: nextStatus === 'HIDDEN' ? 'Hide Post' : 'Activate Post',
      message: `Are you sure you want to change post status to ${nextStatus}?`,
      confirmButtonText: nextStatus === 'HIDDEN' ? 'Yes, Hide' : 'Yes, Activate',
      danger: false,
      payload: { post, nextPostStatus: nextStatus }
    });
  }

  closeConfirmModal(): void {
    if (this.confirmActionLoading) return;
    this.confirmActionType = null;
    this.confirmPayload = null;
    this.confirmTitle = '';
    this.confirmMessage = '';
    this.confirmButtonText = 'Confirm';
    this.confirmDanger = false;
  }

  confirmAdminAction(): void {
    if (!this.confirmActionType || this.confirmActionLoading) return;
    this.confirmActionLoading = true;

    if (this.confirmActionType === 'TOGGLE_USER_ROLE') {
      const user = this.confirmPayload?.user;
      const nextRole = this.confirmPayload?.nextUserRole;
      if (!user || !nextRole) {
        this.confirmActionLoading = false;
        return;
      }
      this.api.updateAdminUserRole(user.userId, nextRole).subscribe({
        next: (updated) => {
          this.users = this.users.map((u) => (u.userId === updated.userId ? updated : u));
          this.confirmActionLoading = false;
          this.closeConfirmModal();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error || 'Failed to update user role';
          this.confirmActionLoading = false;
        }
      });
      return;
    }

    if (this.confirmActionType === 'TOGGLE_USER_STATUS') {
      const user = this.confirmPayload?.user;
      const nextStatus = this.confirmPayload?.nextUserStatus;
      if (!user || !nextStatus) {
        this.confirmActionLoading = false;
        return;
      }
      this.api.updateAdminUserStatus(user.userId, nextStatus).subscribe({
        next: (updated) => {
          this.users = this.users.map((u) => (u.userId === updated.userId ? updated : u));
          this.confirmActionLoading = false;
          this.closeConfirmModal();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error || 'Failed to update user status';
          this.confirmActionLoading = false;
        }
      });
      return;
    }

    if (this.confirmActionType === 'DELETE_USER') {
      const user = this.confirmPayload?.user;
      if (!user) {
        this.confirmActionLoading = false;
        return;
      }
      this.api.deleteUser(user.userId).subscribe({
        next: () => {
          this.users = this.users.filter((u) => u.userId !== user.userId);
          delete this.userPostsCount[user.userId];
          delete this.followerCountByUser[user.userId];
          this.posts = this.posts.filter((p) => p.userId !== user.userId);
          this.recomputeUserPostCounts();
          this.reports = this.reports.filter((r) =>
            r.reporterUserId !== user.userId &&
            r.reportedUserId !== user.userId &&
            r.blogAuthorUserId !== user.userId
          );
          this.reportsCount = this.reports.length;
          this.confirmActionLoading = false;
          this.closeConfirmModal();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error || 'Failed to delete user';
          this.confirmActionLoading = false;
        }
      });
      return;
    }

    if (this.confirmActionType === 'TOGGLE_POST_STATUS') {
      const post = this.confirmPayload?.post;
      const nextStatus = this.confirmPayload?.nextPostStatus;
      if (!post?.idBlog || !nextStatus) {
        this.confirmActionLoading = false;
        return;
      }
      this.api.updateAdminPostStatus(post.idBlog, nextStatus).subscribe({
        next: (updated) => {
          this.posts = this.posts.map((p) => (p.idBlog === updated.idBlog ? updated : p));
          this.confirmActionLoading = false;
          this.closeConfirmModal();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error || 'Failed to update post status';
          this.confirmActionLoading = false;
        }
      });
      return;
    }

    if (this.confirmActionType === 'DELETE_POST') {
      const postId = this.confirmPayload?.post?.idBlog ?? this.confirmPayload?.report?.blogId;
      if (!postId) {
        this.confirmActionLoading = false;
        return;
      }
      this.api.deleteBlog(postId).subscribe({
        next: () => {
          this.posts = this.posts.filter((p) => p.idBlog !== postId);
          this.recomputeUserPostCounts();
          this.reports = this.reports.filter((r) => r.blogId !== postId);
          this.reportsCount = this.reports.length;
          this.confirmActionLoading = false;
          this.closeConfirmModal();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error || 'Failed to delete post';
          this.confirmActionLoading = false;
        }
      });
      return;
    }

    this.confirmActionLoading = false;
  }

  private openConfirmModal(config: {
    type: ConfirmActionType;
    title: string;
    message: string;
    confirmButtonText: string;
    danger: boolean;
    payload: ConfirmPayload;
  }): void {
    this.confirmActionType = config.type;
    this.confirmPayload = config.payload;
    this.confirmTitle = config.title;
    this.confirmMessage = config.message;
    this.confirmButtonText = config.confirmButtonText;
    this.confirmDanger = config.danger;
  }
}
