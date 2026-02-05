import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter, Subscription } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../core/models';

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
  private navSub?: Subscription;

  constructor(private auth: AuthService, private router: Router, private location: Location) {}

  ngOnInit(): void {
    this.syncState();
    this.navSub = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.syncState();
    });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  private syncState(): void {
    this.user = this.auth.getCurrentUser();
    const url = this.router.url;
    this.showBack = url !== '/home';
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
}
