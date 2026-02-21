import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  const backendOrigin = 'http://localhost:8080';

  const normalizeError = (err: HttpErrorResponse): HttpErrorResponse => {
    if (err.error?.message) {
      return err;
    }

    let message = 'Request failed';
    if (err.status === 0) {
      message = 'Cannot reach server. Please check your connection and try again.';
    } else if (err.status >= 500) {
      message = 'Internal server error. Please try again later.';
    } else if (typeof err.error === 'string' && err.error.trim()) {
      message = err.error;
    } else if (err.message) {
      message = err.message;
    }

    return new HttpErrorResponse({
      error: { message },
      headers: err.headers,
      status: err.status,
      statusText: err.statusText,
      url: err.url ?? undefined
    });
  };

  const shouldShowServerErrorPage = (err: HttpErrorResponse): boolean => {
    const isBackendCall = req.url.startsWith(backendOrigin);
    const isServerFailure = err.status === 500 || err.status === 0;
    const alreadyOnErrorPage = router.url === '/server-error';
    return isBackendCall && isServerFailure && !alreadyOnErrorPage;
  };

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq).pipe(
      catchError((rawErr) => {
        const err = rawErr instanceof HttpErrorResponse ? rawErr : new HttpErrorResponse({ error: rawErr });
        if (err.status === 401) {
          auth.logout();
          router.navigateByUrl('/login');
        }
        if (shouldShowServerErrorPage(err)) {
          router.navigateByUrl('/server-error');
        }
        return throwError(() => normalizeError(err));
      })
    );
  }

  return next(req).pipe(
    catchError((rawErr) => {
      const err = rawErr instanceof HttpErrorResponse ? rawErr : new HttpErrorResponse({ error: rawErr });
      if (shouldShowServerErrorPage(err)) {
        router.navigateByUrl('/server-error');
      }
      return throwError(() => normalizeError(err));
    })
  );
};
