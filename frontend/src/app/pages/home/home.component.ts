import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Blog, UserResponse } from '../../core/models';

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
      },
      error: (err) => {
        this.error = err?.error || 'Failed to create blog';
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
