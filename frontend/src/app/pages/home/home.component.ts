import { Component, OnInit } from '@angular/core';
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
  mediaByBlog: Record<number, Media[]> = {};

  error = '';
  loading = false;

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
        this.error = err?.error || 'Failed to load blogs';
        this.loading = false;
      }
    });
  }

  createBlog(): void {
    if (!this.user) return;
    this.error = '';
    this.api.createBlog(this.user.userId, this.newBlog).subscribe({
      next: (blog) => {
        this.blogs = [blog, ...this.blogs];
        this.newBlog = { title: '', content: '', status: 'ACTIVE', media: '' };
        if (blog.idBlog && this.mediaFiles.length) {
          const files = [...this.mediaFiles];
          this.mediaFiles = [];
          this.api.uploadMedia(blog.idBlog, files).subscribe({
            next: (media) => {
              this.mediaByBlog[blog.idBlog!] = media;
            },
            error: (err) => {
              this.error = err?.error || 'Failed to upload media';
            }
          });
        }
      },
      error: (err) => {
        this.error = err?.error || 'Failed to create blog';
      }
    });
  }

  onMediaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length > 10) {
      this.error = 'Maximum 10 files allowed';
      this.mediaFiles = [];
      input.value = '';
      return;
    }
    this.mediaFiles = files;
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
