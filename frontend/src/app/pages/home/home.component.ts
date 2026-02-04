import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Blog, Comment, Like, UserResponse } from '../../core/models';

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
  comments: Comment[] = [];
  likes: Like[] = [];
  users: UserResponse[] = [];

  statusFilter = 'ACTIVE';
  selectedBlogId: number | null = null;
  selectedBlog: Blog | null = null;

  newBlog: Blog = { title: '', content: '', status: 'ACTIVE', media: '' };
  newComment = '';
  profile = {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: ''
  };

  commentEditId: number | null = null;
  commentEditContent = '';
  commentLookupId: number | null = null;
  commentLookupUserId: number | null = null;
  commentLookup: Comment | null = null;
  commentUserList: Comment[] = [];

  likeUserId: number | null = null;
  blogEditId: number | null = null;
  blogEditTitle = '';
  blogEditContent = '';

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
    this.refreshCurrentUser();
    this.loadMyBlogs();
    this.loadUsers();
  }

  refreshCurrentUser(): void {
    if (!this.user) return;
    this.api.getUserById(this.user.userId).subscribe({
      next: (data) => {
        this.user = data;
        this.auth.setCurrentUser(data);
        this.profile = {
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.userName,
          email: data.email,
          password: ''
        };
      }
    });
  }

  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: (data) => (this.users = data),
      error: () => (this.users = [])
    });
  }

  updateProfile(): void {
    if (!this.user) return;
    this.api.updateUser(this.user.userId, this.profile).subscribe({
      next: (data) => {
        this.user = data;
        this.auth.setCurrentUser(data);
      },
      error: (err) => {
        this.error = err?.error || 'Failed to update profile';
      }
    });
  }

  deleteAccount(): void {
    if (!this.user) return;
    this.api.deleteUser(this.user.userId).subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.error = err?.error || 'Failed to delete account';
      }
    });
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

  loadByStatus(): void {
    this.loading = true;
    this.api.getBlogsByStatus(this.statusFilter).subscribe({
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

  selectBlog(blogId: number | undefined): void {
    if (!blogId) return;
    this.selectedBlogId = blogId;
    this.api.getBlogById(blogId).subscribe({
      next: (data) => {
        this.selectedBlog = data;
        this.blogEditId = data.idBlog || null;
        this.blogEditTitle = data.title || '';
        this.blogEditContent = data.content || '';
      }
    });
    this.loadComments(blogId);
    this.loadLikes(blogId);
  }

  loadComments(blogId: number): void {
    this.api.getCommentsByBlog(blogId).subscribe({
      next: (data) => (this.comments = data),
      error: () => (this.comments = [])
    });
  }

  loadLikes(blogId: number): void {
    this.api.getLikesByBlog(blogId).subscribe({
      next: (data) => (this.likes = data),
      error: () => (this.likes = [])
    });
  }

  addComment(): void {
    if (!this.user || !this.selectedBlogId || !this.newComment.trim()) return;
    this.api.addComment(this.selectedBlogId, this.user.userId, { content: this.newComment }).subscribe({
      next: (comment) => {
        this.comments = [...this.comments, comment];
        this.newComment = '';
      },
      error: (err) => {
        this.error = err?.error || 'Failed to add comment';
      }
    });
  }

  updateComment(): void {
    if (!this.commentEditId) return;
    this.api.updateComment(this.commentEditId, { content: this.commentEditContent }).subscribe({
      next: () => {
        if (this.selectedBlogId) {
          this.loadComments(this.selectedBlogId);
        }
        this.commentEditId = null;
        this.commentEditContent = '';
      },
      error: (err) => {
        this.error = err?.error || 'Failed to update comment';
      }
    });
  }

  deleteComment(commentId: number | undefined): void {
    if (!commentId) return;
    this.api.deleteComment(commentId).subscribe({
      next: () => {
        if (this.selectedBlogId) {
          this.loadComments(this.selectedBlogId);
        }
      },
      error: (err) => {
        this.error = err?.error || 'Failed to delete comment';
      }
    });
  }

  loadCommentById(): void {
    if (!this.commentLookupId) return;
    this.api.getCommentById(this.commentLookupId).subscribe({
      next: (data) => (this.commentLookup = data),
      error: () => (this.commentLookup = null)
    });
  }

  loadCommentsByUser(): void {
    if (!this.commentLookupUserId) return;
    this.api.getCommentsByUser(this.commentLookupUserId).subscribe({
      next: (data) => (this.commentUserList = data),
      error: () => (this.commentUserList = [])
    });
  }

  updateBlog(): void {
    if (!this.blogEditId) return;
    this.api.updateBlog(this.blogEditId, {
      title: this.blogEditTitle,
      content: this.blogEditContent
    }).subscribe({
      next: (blog) => {
        this.selectedBlog = blog;
        this.loadMyBlogs();
      },
      error: (err) => {
        this.error = err?.error || 'Failed to update blog';
      }
    });
  }

  deleteBlog(): void {
    if (!this.blogEditId) return;
    this.api.deleteBlog(this.blogEditId).subscribe({
      next: () => {
        this.selectedBlog = null;
        this.selectedBlogId = null;
        this.loadMyBlogs();
        this.comments = [];
        this.likes = [];
      },
      error: (err) => {
        this.error = err?.error || 'Failed to delete blog';
      }
    });
  }

  likeSelected(): void {
    if (!this.user || !this.selectedBlogId) return;
    this.api.like(this.selectedBlogId, this.user.userId).subscribe({
      next: (like) => {
        this.likes = [...this.likes, like];
      },
      error: (err) => {
        this.error = err?.error || 'Failed to like';
      }
    });
  }

  unlikeSelected(): void {
    if (!this.user || !this.selectedBlogId) return;
    this.api.unlike(this.selectedBlogId, this.user.userId).subscribe({
      next: () => {
        this.loadLikes(this.selectedBlogId!);
      },
      error: (err) => {
        this.error = err?.error || 'Failed to unlike';
      }
    });
  }

  loadLikesByUser(): void {
    if (!this.likeUserId) return;
    this.api.getLikesByUser(this.likeUserId).subscribe({
      next: (data) => (this.likes = data),
      error: () => (this.likes = [])
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
