import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AuthResponse, Blog, Comment, Like, Media, UserResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  register(payload: {
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    password: string;
  }) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/users/register`, payload);
  }

  login(payload: { emailOrUsername: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/users/login`, payload);
  }

  getUsers() {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/users`);
  }

  getUserById(userId: number) {
    return this.http.get<UserResponse>(`${this.baseUrl}/users/${userId}`);
  }

  updateUser(userId: number, payload: {
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    password: string;
  }) {
    return this.http.put<UserResponse>(`${this.baseUrl}/users/${userId}`, payload);
  }

  deleteUser(userId: number) {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}`);
  }

  createBlog(userId: number, payload: Blog) {
    return this.http.post<Blog>(`${this.baseUrl}/blogs?userId=${userId}`, payload);
  }

  createBlogWithMedia(userId: number, payload: Blog, files: File[]) {
    const form = new FormData();
    form.append('userId', String(userId));
    form.append('title', payload.title || '');
    form.append('content', payload.content || '');
    if (payload.status) {
      form.append('status', payload.status);
    }
    files.forEach((file) => form.append('files', file));
    return this.http.post<Blog>(`${this.baseUrl}/blogs/with-media`, form);
  }

  updateBlog(blogId: number, payload: Partial<Blog>) {
    return this.http.put<Blog>(`${this.baseUrl}/blogs/${blogId}`, payload);
  }

  deleteBlog(blogId: number) {
    return this.http.delete<void>(`${this.baseUrl}/blogs/${blogId}`);
  }

  getBlogById(blogId: number) {
    return this.http.get<Blog>(`${this.baseUrl}/blogs/${blogId}`);
  }

  getBlogsByUser(userId: number) {
    return this.http.get<Blog[]>(`${this.baseUrl}/blogs/by-user/${userId}`);
  }

  getBlogsByStatus(status: string) {
    return this.http.get<Blog[]>(`${this.baseUrl}/blogs/status/${status}`);
  }

  addComment(blogId: number, userId: number, payload: Comment) {
    return this.http.post<Comment>(
      `${this.baseUrl}/comments?blogId=${blogId}&userId=${userId}`,
      payload
    );
  }

  updateComment(commentId: number, payload: Partial<Comment>) {
    return this.http.put<Comment>(`${this.baseUrl}/comments/${commentId}`, payload);
  }

  deleteComment(commentId: number) {
    return this.http.delete<void>(`${this.baseUrl}/comments/${commentId}`);
  }

  getCommentById(commentId: number) {
    return this.http.get<Comment>(`${this.baseUrl}/comments/${commentId}`);
  }

  getCommentsByBlog(blogId: number) {
    return this.http.get<Comment[]>(`${this.baseUrl}/comments/by-blog/${blogId}`);
  }

  getCommentsByUser(userId: number) {
    return this.http.get<Comment[]>(`${this.baseUrl}/comments/by-user/${userId}`);
  }

  like(blogId: number, userId: number) {
    return this.http.post<Like>(`${this.baseUrl}/likes?blogId=${blogId}&userId=${userId}`, {});
  }

  unlike(blogId: number, userId: number) {
    return this.http.delete<void>(`${this.baseUrl}/likes?blogId=${blogId}&userId=${userId}`);
  }

  getLikesByBlog(blogId: number) {
    return this.http.get<Like[]>(`${this.baseUrl}/likes/by-blog?blogId=${blogId}`);
  }

  getLikesByUser(userId: number) {
    return this.http.get<Like[]>(`${this.baseUrl}/likes/by-user?userId=${userId}`);
  }

  uploadMedia(blogId: number, files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return this.http.post<Media[]>(`${this.baseUrl}/media/upload/${blogId}`, form);
  }

  getMediaByBlog(blogId: number) {
    return this.http.get<Media[]>(`${this.baseUrl}/media/by-blog/${blogId}`);
  }
}
