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
    this.user = this.auth.getCurrentUser();
    if (!this.user) {
      this.router.navigateByUrl('/login');
      return;
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigateByUrl('/home');
      return;
    }
    this.loadBlog(id);
    this.loadMedia(id);
    this.loadComments(id);
    this.loadLikeStatus(id);
  }

  loadBlog(blogId: number): void {
    this.api.getBlogById(blogId).subscribe({
      next: (blog) => {
        this.blog = blog;
        this.likeCount = blog.likeCount || 0;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load blog';
      }
    });
  }

  loadMedia(blogId: number): void {
    this.api.getMediaByBlog(blogId).subscribe({
      next: (media) => {
        this.media = media || [];
        this.selectedMediaIndex = 0;
      },
      error: () => {
        this.media = [];
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

  canReport(): boolean {
    if (!this.user || !this.blog) return false;
    if (!this.blog.user?.userId) return true;
    return this.blog.user.userId !== this.user.userId;
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
}
