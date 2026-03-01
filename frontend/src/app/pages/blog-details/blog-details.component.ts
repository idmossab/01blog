import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Blog, Comment, LikeStatus, Media, ReportReason, UserResponse } from '../../core/models';

@Component({
  selector: 'app-blog-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blog-details.component.html',
  styleUrl: './blog-details.component.css'
})
export class BlogDetailsComponent implements OnInit {
  readonly reportReasons: Array<{ value: ReportReason; label: string }> = [
    { value: 'HARASSMENT_BULLYING', label: 'Harassment / Bullying' },
    { value: 'SPAM_SCAM', label: 'Spam / Scam' },
    { value: 'HATE_SPEECH', label: 'Hate speech' },
    { value: 'VIOLENCE_THREATS', label: 'Violence / Threats' },
    { value: 'SEXUAL_CONTENT', label: 'Sexual content' },
    { value: 'COPYRIGHT_IP', label: 'Copyright / IP' },
    { value: 'OTHER', label: 'Other' }
  ];

  user: UserResponse | null = null;
  blog: Blog | null = null;
  media: Media[] = [];
  selectedMediaIndex = 0;
  comments: Comment[] = [];
  deletingCommentIds = new Set<number>();
  newComment = '';
  error = '';
  reportSuccess = '';
  liked = false;
  likeCount = 0;
  reportModalOpen = false;
  selectedReportReason: ReportReason | '' = '';
  reportDetails = '';
  reportError = '';
  reportSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.auth.getToken()) {
      this.router.navigateByUrl('/login');
      return;
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigateByUrl('/home');
      return;
    }
    this.api.getMe().subscribe({
      next: (me) => {
        this.user = me;
        this.auth.setCurrentUser(me);
        this.loadBlog(id);
        this.loadMedia(id);
        this.loadComments(id);
        this.loadLikeStatus(id);
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load session';
      }
    });
  }

  loadBlog(blogId: number): void {
    this.api.getBlogById(blogId).subscribe({
      next: (blog) => {
        this.blog = blog;
        this.likeCount = blog.likeCount || 0;
        if (!this.media.length && (blog.mediaFiles || []).length) {
          this.media = (blog.mediaFiles || []).map((item) => this.normalizeMedia(item));
          this.selectedMediaIndex = 0;
        }
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load blog';
      }
    });
  }

  loadMedia(blogId: number): void {
    this.api.getMediaByBlog(blogId).subscribe({
      next: (media) => {
        this.media = (media || []).map((item) => this.normalizeMedia(item));
        this.selectedMediaIndex = 0;
      },
      error: () => {
        this.media = (this.blog?.mediaFiles || []).map((item) => this.normalizeMedia(item));
        this.selectedMediaIndex = 0;
      }
    });
  }

  loadComments(blogId: number): void {
    this.api.getCommentsByBlog(blogId).subscribe({
      next: (comments) => (this.comments = comments),
      error: () => (this.comments = [])
    });
  }

  loadLikeStatus(blogId: number): void {
    if (!this.user) return;
    this.api.getLikeStatus(blogId, this.user.userId).subscribe({
      next: (status: LikeStatus) => {
        this.liked = status.liked;
        this.likeCount = status.likeCount;
      },
      error: () => {
        this.liked = false;
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

  selectMedia(index: number): void {
    this.selectedMediaIndex = index;
  }

  toggleLike(): void {
    if (!this.user || !this.blog?.idBlog) return;
    const blogId = this.blog.idBlog;
    const previousLiked = this.liked;
    const previousCount = this.likeCount;
    this.liked = !previousLiked;
    this.likeCount = previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1;

    const request$ = (previousLiked
      ? this.api.unlike(blogId, this.user.userId)
      : this.api.like(blogId, this.user.userId)) as Observable<unknown>;

    request$.subscribe({
      next: () => {},
      error: (err: any) => {
        this.liked = previousLiked;
        this.likeCount = previousCount;
        this.error = err?.error?.message || err?.error || 'Failed to update like';
      }
    });
  }

  submitComment(): void {
    if (!this.user || !this.blog?.idBlog) return;
    const content = this.newComment.trim();
    if (!content) {
      this.error = 'Comment cannot be empty';
      return;
    }
    this.error = '';
    this.api.addComment(this.blog.idBlog, this.user.userId, { content }).subscribe({
      next: (comment) => {
        this.comments = [comment, ...this.comments];
        this.newComment = '';
        if (this.blog) {
          this.blog.commentCount = (this.blog.commentCount || 0) + 1;
        }
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to add comment';
      }
    });
  }

  canDeleteComment(comment: Comment): boolean {
    if (!this.user || !comment?.user?.userId) return false;
    return comment.user.userId === this.user.userId;
  }

  confirmDeleteComment(comment: Comment): void {
    const confirmed = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmed) return;
    this.deleteComment(comment);
  }

  deleteComment(comment: Comment): void {
    const commentId = comment?.id;
    if (!commentId || !this.blog?.idBlog || this.deletingCommentIds.has(commentId)) return;

    this.deletingCommentIds.add(commentId);
    this.error = '';
    this.api.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter((item) => item.id !== commentId);
        if (this.blog) {
          this.blog.commentCount = Math.max(0, (this.blog.commentCount || 0) - 1);
        }
        this.deletingCommentIds.delete(commentId);
      },
      error: (err: any) => {
        this.deletingCommentIds.delete(commentId);
        this.error = err?.error?.message || err?.error || 'Failed to delete comment';
      }
    });
  }

  canReport(): boolean {
    if (!this.user || !this.blog) return false;
    const authorId = this.blog.userId ?? this.blog.user?.userId;
    if (!authorId) return true;
    return authorId !== this.user.userId;
  }

  openReportModal(): void {
    this.reportModalOpen = true;
    this.reportError = '';
    this.reportSuccess = '';
    this.selectedReportReason = '';
    this.reportDetails = '';
  }

  closeReportModal(): void {
    this.reportModalOpen = false;
    this.reportError = '';
    this.reportSubmitting = false;
  }

  submitReport(): void {
    if (!this.blog?.idBlog || !this.selectedReportReason || this.reportSubmitting) {
      if (!this.selectedReportReason) {
        this.reportError = 'Report reason is required';
      }
      return;
    }

    const details = this.reportDetails.trim();
    if (details.length > 500) {
      this.reportError = 'Additional details cannot exceed 500 characters';
      return;
    }

    this.reportSubmitting = true;
    this.reportError = '';
    this.api.reportBlog({
      blogId: this.blog.idBlog,
      reason: this.selectedReportReason,
      details: details || null
    }).subscribe({
      next: (res) => {
        this.reportSuccess = res?.message || 'Report submitted. Thank you.';
        this.reportSubmitting = false;
        this.reportModalOpen = false;
      },
      error: (err: any) => {
        this.reportSubmitting = false;
        this.reportError = err?.error?.message || err?.error || 'Failed to submit report';
      }
    });
  }

  getBlogAuthorName(): string {
    if (!this.blog) return 'Unknown user';
    const firstName = (this.blog.userFirstName || this.blog.user?.firstName || '').trim();
    const lastName = (this.blog.userLastName || this.blog.user?.lastName || '').trim();
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    const username = (this.blog.userName || this.blog.user?.userName || '').trim();
    if (username) {
      return `@${username}`;
    }
    if (this.user && this.blog.userId === this.user.userId) {
      return `${this.user.firstName} ${this.user.lastName}`.trim() || `@${this.user.userName}`;
    }
    return 'Unknown user';
  }

  getCommentAuthorName(comment: Comment): string {
    const firstName = (comment?.user?.firstName || '').trim();
    const lastName = (comment?.user?.lastName || '').trim();
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    const username = (comment?.user?.userName || '').trim();
    if (username) {
      return `@${username}`;
    }
    return 'Unknown user';
  }

  private normalizeMedia(media: Media): Media {
    const rawUrl = (media?.url || '').trim();
    if (!rawUrl) {
      return media;
    }
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
      return media;
    }
    const normalizedPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return { ...media, url: `http://localhost:8080${normalizedPath}` };
  }
}
