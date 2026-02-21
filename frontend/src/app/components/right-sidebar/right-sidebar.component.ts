import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, throttleTime } from 'rxjs/operators';
import { fromEvent, Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../core/models';
import { FeedRefreshService } from '../../core/feed-refresh.service';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './right-sidebar.component.html',
  styleUrl: './right-sidebar.component.css'
})
export class RightSidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  searchControl = new FormControl('', { nonNullable: true });
  followedIds = new Set<number>();
  allCandidates: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];
  displayedUsers: UserResponse[] = [];
  followLoadingIds = new Set<number>();

  loading = false;
  loadingMore = false;
  endReached = false;

  private scrollSub?: Subscription;
  private searchSub?: Subscription;
  private currentUserId: number | null = null;

  private readonly initialCount = 10;
  private readonly incrementCount = 3;
  private displayCount = this.initialCount;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private feedRefresh: FeedRefreshService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.getToken()) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.setupSearch();
    this.api.getMe().subscribe({
      next: (me) => {
        this.currentUserId = me.userId;
        this.auth.setCurrentUser(me);
        this.loadFollowedIds();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.scrollContainer) return;
    this.scrollSub = fromEvent(this.scrollContainer.nativeElement, 'scroll')
      .pipe(throttleTime(250))
      .subscribe(() => this.onScroll());
  }

  ngOnDestroy(): void {
    this.scrollSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  private setupSearch(): void {
    this.searchSub = this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.displayCount = this.initialCount;
        this.applyFilters();
      });
  }

  private loadFollowedIds(): void {
    this.api.getFollowingIds().subscribe({
      next: (ids) => {
        this.followedIds = new Set(ids || []);
        this.loadUsers();
      },
      error: () => {
        this.followedIds = new Set();
        this.loadUsers();
      }
    });
  }

  private loadUsers(): void {
    this.api.getUsers().subscribe({
      next: (users) => {
        this.allCandidates = users || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.allCandidates = [];
        this.filteredUsers = [];
        this.displayedUsers = [];
        this.loading = false;
      }
    });
  }

  private applyFilters(): void {
    const term = this.searchControl.value.trim().toLowerCase();
    this.filteredUsers = this.allCandidates.filter((user) => {
      if (this.currentUserId && user.userId === this.currentUserId) return false;
      if (this.followedIds.has(user.userId)) return false;
      if (!term) return true;
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const username = `@${user.userName}`.toLowerCase();
      return fullName.includes(term) || username.includes(term);
    });

    this.endReached = this.filteredUsers.length <= this.displayCount;
    this.displayedUsers = this.filteredUsers.slice(0, this.displayCount);
  }

  private onScroll(): void {
    if (!this.scrollContainer || this.loadingMore || this.endReached) return;
    const el = this.scrollContainer.nativeElement;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < 120) {
      this.loadMore();
    }
  }

  private loadMore(): void {
    if (this.endReached) return;
    this.loadingMore = true;
    this.displayCount += this.incrementCount;
    this.displayedUsers = this.filteredUsers.slice(0, this.displayCount);
    this.endReached = this.filteredUsers.length <= this.displayCount;
    this.loadingMore = false;
  }

  follow(userId: number): void {
    if (this.followLoadingIds.has(userId)) return;
    this.followLoadingIds.add(userId);
    this.api.followUser(userId).subscribe({
      next: () => {
        this.followedIds.add(userId);
        this.followLoadingIds.delete(userId);
        this.applyFilters();
        this.feedRefresh.trigger();
      },
      error: () => {
        this.followLoadingIds.delete(userId);
      }
    });
  }

  openUserProfile(userId: number): void {
    this.router.navigateByUrl(`/profile/${userId}`);
  }
}
