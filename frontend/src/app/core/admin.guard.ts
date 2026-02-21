import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { ApiService } from './api.service';

export const adminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  const current = auth.getCurrentUser();
  if (current?.role === 'ADMIN') {
    return true;
  }

  if (!auth.getToken()) {
    return router.createUrlTree(['/login']);
  }

  return firstValueFrom(api.getMe())
    .then((me) => {
      if (me?.role === 'ADMIN') {
        auth.setCurrentUser(me);
        return true;
      }
      return router.createUrlTree(['/forbidden']);
    })
    .catch(() => router.createUrlTree(['/forbidden']));
};
