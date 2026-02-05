import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Blog, Media, UserResponse } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  user: UserResponse | null = null;
  blogs: Blog[] = [];

  newBlog: Blog = { title: '', content: '', status: 'ACTIVE', media: '' };
  mediaFiles: File[] = [];
  mediaPreviews: Array<{ file: File; url: string; kind: 'image' | 'video' }> = [];
  totalMediaSize = 0;
  mediaByBlog: Record<number, Media[]> = {};

  error = '';
  loading = false;
  @ViewChild('mediaInput') mediaInput?: ElementRef<HTMLInputElement>;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    if (!this.user) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.loadMyBlogs();
  }

  loadMyBlogs(): void {
    if (!this.user) return;
    this.loading = true;
    this.api.getBlogsByUser(this.user.userId).subscribe({
      next: (data) => {
        this.blogs = data;
        this.loading = false;
      },
      error: (err) => {
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
      error: (err) => {
        this.error = err?.error?.message || err?.error || 'Failed to create blog';
      }
    });
  }

  onMediaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length > 10) {
      this.error = 'Maximum 10 files allowed';
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

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
