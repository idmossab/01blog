import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Blog, FollowCounts, Media, UserResponse } from '../../core/models';
import { BlogCardComponent } from '../../components/blog-card/blog-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, BlogCardComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  readonly maxBlogContentLength = 1000;
  user: UserResponse | null = null;
  blogs: Blog[] = [];
  thumbnailByBlog: Record<number, Media | null> = {};
  blogCount = 0;
  followCounts: FollowCounts = { following: 0, followers: 0 };
  loading = true;
  error = '';
  pendingDeleteBlog: Blog | null = null;
  deleteLoading = false;
  editingBlogId: number | null = null;
  editBlog: Blog = { title: '', content: '', status: 'ACTIVE', media: '' };
  editExistingMedia: Media[] = [];
  deletingExistingMediaId: number | null = null;
  editMediaPreviews: Array<{ file: File; url: string; kind: 'image' | 'video' }> = [];
  editTotalMediaSize = 0;
  updateLoading = false;

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.auth.getToken()) {
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
        this.preloadThumbnails();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to load blogs';
        this.loading = false;
      }
    });
  }

  private preloadThumbnails(): void {
    this.blogs.forEach((blog) => {
      if (!blog.idBlog) return;
      const blogId = blog.idBlog;
      if (!this.thumbnailByBlog[blogId]) {
        this.api.getFirstMediaByBlog(blogId).subscribe({
          next: (media) => (this.thumbnailByBlog[blogId] = media),
          error: () => (this.thumbnailByBlog[blogId] = null)
        });
      }
    });
  }

  openDetails(blogId: number | undefined): void {
    if (!blogId) return;
    this.router.navigateByUrl(`/blogs/${blogId}`);
  }

  openDeleteConfirmation(blog: Blog): void {
    this.pendingDeleteBlog = blog;
  }

  closeDeleteConfirmation(): void {
    this.pendingDeleteBlog = null;
  }

  confirmDeleteBlog(): void {
    if (!this.pendingDeleteBlog?.idBlog || this.deleteLoading) return;
    this.deleteLoading = true;
    this.error = '';
    const blogId = this.pendingDeleteBlog.idBlog;
    this.api.deleteBlog(blogId).subscribe({
      next: () => {
        this.blogs = this.blogs.filter((item) => item.idBlog !== blogId);
        this.blogCount = Math.max(0, this.blogCount - 1);
        delete this.thumbnailByBlog[blogId];
        if (this.editingBlogId === blogId) {
          this.cancelEditBlog();
        }
        this.pendingDeleteBlog = null;
        this.deleteLoading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to delete blog';
        this.deleteLoading = false;
      }
    });
  }

  startEditBlog(blog: Blog): void {
    if (!blog.idBlog) return;
    this.error = '';
    this.editingBlogId = blog.idBlog;
    this.editBlog = {
      title: blog.title || '',
      content: blog.content || '',
      status: blog.status || 'ACTIVE',
      media: blog.media || ''
    };
    this.clearEditMediaSelection();
    this.api.getMediaByBlog(blog.idBlog).subscribe({
      next: (media) => (this.editExistingMedia = media || []),
      error: () => (this.editExistingMedia = [])
    });
  }

  cancelEditBlog(): void {
    this.editingBlogId = null;
    this.editBlog = { title: '', content: '', status: 'ACTIVE', media: '' };
    this.editExistingMedia = [];
    this.deletingExistingMediaId = null;
    this.clearEditMediaSelection();
    this.updateLoading = false;
  }

  removeExistingMedia(media: Media): void {
    if (!media.id || this.deletingExistingMediaId !== null) return;
    this.error = '';
    this.deletingExistingMediaId = media.id;
    this.api.deleteMedia(media.id).subscribe({
      next: () => {
        this.editExistingMedia = this.editExistingMedia.filter((item) => item.id !== media.id);
        const blogId = this.editingBlogId;
        if (blogId) {
          this.api.getFirstMediaByBlog(blogId).subscribe({
            next: (firstMedia) => (this.thumbnailByBlog[blogId] = firstMedia),
            error: () => (this.thumbnailByBlog[blogId] = null)
          });
        }
        this.deletingExistingMediaId = null;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to delete media';
        this.deletingExistingMediaId = null;
      }
    });
  }

  hasRequiredEditText(): boolean {
    const title = this.editBlog.title?.trim() || '';
    const content = this.editBlog.content?.trim() || '';
    return title.length > 0 && content.length > 0;
  }

  onEditMediaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length > 5) {
      this.error = 'Maximum 5 files allowed';
      this.clearEditMediaSelection();
      input.value = '';
      return;
    }
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      this.error = 'Total media size exceeds 10MB';
      this.clearEditMediaSelection();
      input.value = '';
      return;
    }
    this.error = '';
    this.clearEditMediaSelection();
    this.editMediaPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      kind: file.type.startsWith('video') ? 'video' : 'image'
    }));
    this.editTotalMediaSize = totalSize;
  }

  removeEditMedia(index: number): void {
    const item = this.editMediaPreviews[index];
    if (item) {
      URL.revokeObjectURL(item.url);
    }
    this.editMediaPreviews.splice(index, 1);
    this.editTotalMediaSize = this.editMediaPreviews.reduce((sum, media) => sum + media.file.size, 0);
  }

  clearEditMediaSelection(): void {
    this.editMediaPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    this.editMediaPreviews = [];
    this.editTotalMediaSize = 0;
  }

  saveEditedBlog(): void {
    if (!this.editingBlogId || this.updateLoading) return;
    const title = this.editBlog.title?.trim() || '';
    const content = this.editBlog.content?.trim() || '';
    if (!title || !content) {
      this.error = 'Title and content cannot be empty';
      return;
    }
    if (content.length > this.maxBlogContentLength) {
      this.error = `Blog content cannot exceed ${this.maxBlogContentLength} characters`;
      return;
    }

    this.updateLoading = true;
    this.error = '';
    const blogId = this.editingBlogId;

    this.api.updateBlog(blogId, { title, content, status: this.editBlog.status }).subscribe({
      next: (updated) => {
        const newFiles = this.editMediaPreviews.map((item) => item.file);
        const finishUpdate = () => {
          this.blogs = this.blogs.map((item) => (item.idBlog === blogId ? { ...item, ...updated } : item));
          this.api.getFirstMediaByBlog(blogId).subscribe({
            next: (media) => (this.thumbnailByBlog[blogId] = media),
            error: () => (this.thumbnailByBlog[blogId] = null)
          });
          this.cancelEditBlog();
        };

        if (!newFiles.length) {
          finishUpdate();
          return;
        }

        this.api.uploadMedia(blogId, newFiles).subscribe({
          next: () => finishUpdate(),
          error: (err: any) => {
            this.error = err?.error?.message || err?.error || 'Blog updated, but media upload failed';
            this.updateLoading = false;
          }
        });
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error || 'Failed to update blog';
        this.updateLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.clearEditMediaSelection();
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
