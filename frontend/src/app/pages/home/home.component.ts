import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
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
  user: UserResponse | null = null;
  blogs: Blog[] = [];

  newBlog: Blog = { title: '', content: '', status: 'ACTIVE', media: '' };
  mediaFiles: File[] = [];
  mediaPreviews: Array<{ file: File; url: string; kind: 'image' | 'video' }> = [];
  totalMediaSize = 0;
  mediaByBlog: Record<number, Media[]> = {};
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
    this.api.getFeedBlogs(0, 20).subscribe({
      next: (data) => {
        this.blogs = data?.content || data || [];
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
    const files = this.mediaPreviews.map((item) => item.file);
    this.api.createBlogWithMedia(this.user.userId, this.newBlog, files).subscribe({
      next: (blog) => {
        this.blogs = [blog, ...this.blogs];
        this.newBlog = { title: '', content: '', status: 'ACTIVE', media: '' };
        this.clearMediaSelection();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to create blog';
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
    this.error = '';
    this.clearMediaSelection();
    this.mediaPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      kind: file.type.startsWith('video') ? 'video' : 'image'
    }));
    this.totalMediaSize = totalSize;
  }

  removeMedia(index: number): void {
    const item = this.mediaPreviews[index];
    if (item) {
      URL.revokeObjectURL(item.url);
    }
    this.mediaPreviews.splice(index, 1);
    this.totalMediaSize = this.mediaPreviews.reduce((sum, media) => sum + media.file.size, 0);
    this.mediaFiles = this.mediaPreviews.map((media) => media.file);
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
    this.mediaFiles = [];
    this.totalMediaSize = 0;
    if (this.mediaInput?.nativeElement) {
      this.mediaInput.nativeElement.value = '';
    }
  }

  getMedia(blogId: number | undefined): Media[] {
    if (!blogId) return [];
    if (!this.mediaByBlog[blogId]) {
      this.api.getMediaByBlog(blogId).subscribe({
        next: (data) => (this.mediaByBlog[blogId] = data),
        error: () => (this.mediaByBlog[blogId] = [])
      });
    }
    return this.mediaByBlog[blogId] || [];
  }

  preloadFeedMeta(): void {
    if (!this.user) return;
    const userId = this.user.userId;
    this.blogs.forEach((blog) => {
      if (!blog.idBlog) return;
      const blogId = blog.idBlog;
      if (!this.thumbnailByBlog[blogId]) {
        this.api.getFirstMediaByBlog(blogId).subscribe({
          next: (media) => (this.thumbnailByBlog[blogId] = media),
          error: () => (this.thumbnailByBlog[blogId] = null)
        });
      }
      this.api.getLikeStatus(blogId, userId).subscribe({
        next: (status) => {
          this.likedByBlog[blogId] = status.liked;
          this.likeCountByBlog[blogId] = status.likeCount;
        },
        error: () => {
          this.likedByBlog[blogId] = false;
          this.likeCountByBlog[blogId] = blog.likeCount || 0;
        }
      });
    });
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

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
