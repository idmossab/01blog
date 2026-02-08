import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter, interval, Subscription } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { AppNotification, UserResponse } from '../../core/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  user: UserResponse | null = null;
  showBack = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  notificationsOpen = false;
  notificationsLoading = false;
  notificationsError = '';
  private navSub?: Subscription;
  private pollSub?: Subscription;
  private loadingUser = false;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.syncState();
    this.navSub = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.syncState();
    });
    this.pollSub = interval(30000).subscribe(() => this.refreshUnreadCount());
    this.refreshUnreadCount();
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  private syncState(): void {
    this.user = this.auth.getCurrentUser();
    const url = this.router.url;
    this.showBack = url !== '/home';
    if (!this.auth.getToken()) {
      this.user = null;
      this.notifications = [];
      this.unreadCount = 0;
      this.notificationsOpen = false;
      return;
    }
    if (!this.user && !this.loadingUser) {
      this.loadingUser = true;
      this.api.getMe().subscribe({
        next: (me) => {
          this.user = me;
          this.auth.setCurrentUser(me);
          this.loadingUser = false;
        },
        error: () => {
          this.loadingUser = false;
        }
      });
    }
    this.refreshUnreadCount();
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigateByUrl('/home');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.notificationsOpen = !this.notificationsOpen;
    if (!this.notificationsOpen) return;
    this.loadNotifications();
  }

  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  loadNotifications(): void {
    if (!this.user) return;
    this.notificationsLoading = true;
    this.notificationsError = '';
    this.api.getMyNotifications(20).subscribe({
      next: (items) => {
        this.notifications = items || [];
        this.notificationsLoading = false;
      },
      error: (err: any) => {
        this.notificationsError = err?.error?.message || err?.error || 'Failed to load notifications';
        this.notificationsLoading = false;
      }
    });
  }

  refreshUnreadCount(): void {
    if (!this.user) return;
    this.api.getUnreadNotificationsCount().subscribe({
      next: (res) => (this.unreadCount = res?.count || 0),
      error: () => {}
    });
  }

  openNotification(item: AppNotification, event: Event): void {
    event.stopPropagation();
    const finalize = () => {
      this.notifications = this.notifications.filter((n) => n.id !== item.id);
      this.refreshUnreadCount();
      this.notificationsOpen = false;
      if (item.blogId) {
        this.router.navigateByUrl(`/blogs/${item.blogId}`);
      } else if (item.actorUserId) {
        this.router.navigateByUrl('/profile');
      }
    };

    this.api.deleteNotification(item.id).subscribe({
      next: () => finalize(),
      error: () => finalize()
    });
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    if (!this.user) return;
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((item) => ({ ...item, read: true }));
        this.unreadCount = 0;
      },
      error: () => {}
    });
  }

  relativeTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    const years = Math.floor(days / 365);
    return `${years}y`;
  }
}
