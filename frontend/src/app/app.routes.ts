import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';
import { adminGuard } from './core/admin.guard';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { BlogDetailsComponent } from './pages/blog-details/blog-details.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ServerErrorComponent } from './pages/server-error/server-error.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    component: LoginComponent,
    canMatch: [guestGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canMatch: [guestGuard]
  },
  {
    path: 'home',
    component: HomeComponent,
    canMatch: [authGuard]
  },
  {
    path: 'blogs/:id',
    component: BlogDetailsComponent,
    canMatch: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canMatch: [authGuard]
  },
  {
    path: 'profile/:userId',
    component: ProfileComponent,
    canMatch: [authGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canMatch: [authGuard, adminGuard]
  },
  {
    path: 'forbidden',
    component: ForbiddenComponent
  },
  {
    path: 'server-error',
    component: ServerErrorComponent
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
