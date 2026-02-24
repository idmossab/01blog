import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Blog, Media, UserResponse } from '../../core/models';
import { RightSidebarComponent } from '../../components/right-sidebar/right-sidebar.component';
import { FeedRefreshService } from '../../core/feed-refresh.service';
import { BlogCardComponent } from '../../components/blog-card/blog-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RightSidebarComponent, BlogCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly maxBlogContentLength = 1000;
  private readonly allowedMediaExtensions = new Set(['jpg', 'jpeg', 'png', 'mp4']);
  user: UserResponse | null = null;
  blogs: Blog[] = [];

  newBlog: Blog = { title: '', content: '', status: 'ACTIVE', media: '' };
  mediaPreviews: Array<{ file: File; url: string; kind: 'image' | 'video' }> = [];
  totalMediaSize = 0;
  thumbnailByBlog: Record<number, Media | null> = {};
  likedByBlog: Record<number, boolean | undefined> = {};
  likeCountByBlog: Record<number, number | undefined> = {};

  error = '';
  loading = false;
  private refreshSub?: Subscription;
  @ViewChild('mediaInput') mediaInput?: ElementRef<HTMLInputElement>;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private feedRefresh: FeedRefreshService
  ) {}

  ngOnInit(): void {
    if (!this.auth.getToken()) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.api.getMe().subscribe({
      next: (me) => {
        this.user = me;
        this.auth.setCurrentUser(me);
        this.loadFeed();
        this.refreshSub = this.feedRefresh.refresh$.subscribe(() => this.loadFeed());
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load session';
      }
    });
  }

  loadFeed(): void {
    if (!this.user) return;
    this.loading = true;
    this.api.getFeedBlogs().subscribe({
      next: (blogs) => {
        this.blogs = blogs || [];
        this.preloadFeedMeta();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load blogs';
        this.loading = false;
      }
    });
  }

  createBlog(): void {
    if (!this.user) return;
    this.error = '';
    if (!this.hasRequiredText()) {
      this.error = 'Blog content cannot be empty';
      return;
    }
    if ((this.newBlog.content || '').length > this.maxBlogContentLength) {
      this.error = `Blog content cannot exceed ${this.maxBlogContentLength} characters`;
      return;
    }
    const files = this.mediaPreviews.map((item) => item.file);
    this.api.createBlogWithMedia(this.user.userId, this.newBlog, files).subscribe({
      next: (blog) => {
        this.blogs = [blog, ...this.blogs];
        this.preloadMetaForBlog(blog);
        this.newBlog = { title: '', content: '', status: 'ACTIVE', media: '' };
        this.clearMediaSelection();
      },
      error: (err: any) => {
        this.error = this.extractErrorMessage(err, 'Failed to create blog');
      }
    });
  }

  onMediaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length > 5) {
      this.error = 'Maximum 5 files allowed';
      this.clearMediaSelection();
      input.value = '';
      return;
    }
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      this.error = 'Total media size exceeds 10MB';
      this.clearMediaSelection();
      input.value = '';
      return;
    }

    const preparedPreviews: Array<{ file: File; url: string; kind: 'image' | 'video' }> = [];
    for (const file of files) {
      const kind = this.detectMediaKind(file);
      if (!kind) {
        this.error = 'Only .jpg, .jpeg, .png images and .mp4 videos are allowed';
        this.clearMediaSelection();
        input.value = '';
        return;
      }
      preparedPreviews.push({
        file,
        url: URL.createObjectURL(file),
        kind
      });
    }

    this.error = '';
    this.clearMediaSelection();
    this.mediaPreviews = preparedPreviews;
    this.totalMediaSize = totalSize;
  }

  removeMedia(index: number): void {
    const item = this.mediaPreviews[index];
    if (item) {
      URL.revokeObjectURL(item.url);
    }
    this.mediaPreviews.splice(index, 1);
    this.totalMediaSize = this.mediaPreviews.reduce((sum, media) => sum + media.file.size, 0);
  }

  hasRequiredText(): boolean {
    const title = this.newBlog.title?.trim() || '';
    const content = this.newBlog.content?.trim() || '';
    return title.length > 0 && content.length > 0;
  }

  triggerMediaPicker(): void {
    this.mediaInput?.nativeElement?.click();
  }

  clearMediaSelection(): void {
    this.mediaPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    this.mediaPreviews = [];
    this.totalMediaSize = 0;
    if (this.mediaInput?.nativeElement) {
      this.mediaInput.nativeElement.value = '';
    }
  }

  onPreviewError(index: number): void {
    this.error = 'Invalid file preview. Only real .jpg, .png, and .mp4 files are allowed';
    this.removeMedia(index);
  }

  private getFileExtension(file: File): string {
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    return extension;
  }

  private detectMediaKind(file: File): 'image' | 'video' | null {
    const extension = this.getFileExtension(file);
    if (!this.allowedMediaExtensions.has(extension)) {
      return null;
    }
    const mime = (file.type || '').toLowerCase().split(';', 2)[0].trim();
    if (mime.startsWith('image/')) {
      return extension === 'png' || extension === 'jpg' || extension === 'jpeg' ? 'image' : null;
    }
    if (mime.startsWith('video/')) {
      return extension === 'mp4' ? 'video' : null;
    }
    if (!mime) {
      if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
        return 'image';
      }
      if (extension === 'mp4') {
        return 'video';
      }
    }
    return null;
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === 'string' && err.trim()) {
      return err;
    }
    if (err && typeof err === 'object') {
      const asAny = err as any;
      if (typeof asAny?.error === 'string' && asAny.error.trim()) {
        return asAny.error;
      }
      if (typeof asAny?.error?.message === 'string' && asAny.error.message.trim()) {
        return asAny.error.message;
      }
      if (typeof asAny?.message === 'string' && asAny.message.trim()) {
        return asAny.message;
      }
      if (asAny instanceof HttpErrorResponse && asAny.status === 400) {
        return 'Only real .jpg, .png, and .mp4 files are allowed';
      }
    }
    return fallback;
  }

  preloadFeedMeta(): void {
    if (!this.user) return;
    this.blogs.forEach((blog) => this.preloadMetaForBlog(blog));
  }

  private preloadMetaForBlog(blog: Blog): void {
    if (!this.user || !blog.idBlog) return;
    const blogId = blog.idBlog;
    const mediaFromBlog = (blog.mediaFiles || []).map((item) => this.normalizeMedia(item));

    if (mediaFromBlog.length > 0) {
      this.thumbnailByBlog[blogId] = mediaFromBlog[0];
    } else if (!Object.prototype.hasOwnProperty.call(this.thumbnailByBlog, blogId)) {
      this.api.getFirstMediaByBlog(blogId).subscribe({
        next: (media) => (this.thumbnailByBlog[blogId] = media ? this.normalizeMedia(media) : null),
        error: () => (this.thumbnailByBlog[blogId] = null)
      });
    }

    if (!Object.prototype.hasOwnProperty.call(this.likedByBlog, blogId) ||
        !Object.prototype.hasOwnProperty.call(this.likeCountByBlog, blogId)) {
      this.api.getLikeStatus(blogId, this.user.userId).subscribe({
        next: (status) => {
          this.likedByBlog[blogId] = status.liked;
          this.likeCountByBlog[blogId] = status.likeCount;
        },
        error: () => {
          this.likedByBlog[blogId] = false;
          this.likeCountByBlog[blogId] = blog.likeCount || 0;
        }
      });
    }
  }

  toggleLike(blog: Blog, event: Event): void {
    event.stopPropagation();
    if (!this.user || !blog.idBlog) return;
    const blogId = blog.idBlog;
    const currentLiked = !!this.likedByBlog[blogId];
    const currentCount = this.likeCountByBlog[blogId] ?? blog.likeCount ?? 0;

    this.likedByBlog[blogId] = !currentLiked;
    this.likeCountByBlog[blogId] = currentLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

    const request$ = (currentLiked
      ? this.api.unlike(blogId, this.user.userId)
      : this.api.like(blogId, this.user.userId)) as Observable<unknown>;

    request$.subscribe({
      next: () => {},
      error: (err: any) => {
        this.likedByBlog[blogId] = currentLiked;
        this.likeCountByBlog[blogId] = currentCount;
        this.error = err?.error?.message || err?.error || 'Failed to update like';
      }
    });
  }

  openDetails(blogId: number | undefined): void {
    if (!blogId) return;
    this.router.navigateByUrl(`/blogs/${blogId}`);
  }

  getAuthorName(blog: Blog): string {
    const firstName = (blog.userFirstName || blog.user?.firstName || '').trim();
    const lastName = (blog.userLastName || blog.user?.lastName || '').trim();
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    const username = (blog.userName || blog.user?.userName || '').trim();
    if (username) {
      return `@${username}`;
    }
    if (this.user && blog.userId === this.user.userId) {
      return `${this.user.firstName} ${this.user.lastName}`.trim() || `@${this.user.userName}`;
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

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }
}
