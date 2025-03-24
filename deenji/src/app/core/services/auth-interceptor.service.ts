// src/app/core/services/auth-interceptor.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TRPCClientError } from '@trpc/client';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptorService {
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  /**
   * Intercepts and handles authentication errors from tRPC responses
   */
  handleTrpcErrors<T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      catchError((error) => {
        // Check if it's a tRPC error
        if (error instanceof TRPCClientError) {
          // Extract error code from cause if it exists
          const errorCode = error.message.includes('UNAUTHORIZED')
            ? 'UNAUTHORIZED'
            : error.message.includes('FORBIDDEN')
            ? 'FORBIDDEN'
            : undefined;

          // Check for auth errors in the shape of the TRPCClientError
          if (error.data?.httpStatus === 401 || errorCode === 'UNAUTHORIZED') {
            console.error('Authentication error:', error);
            // Sign out and redirect to login
            this.supabaseService.signOut().then(() => {
              this.router.navigate(['/login'], {
                queryParams: {
                  error: 'Your session has expired. Please log in again.',
                },
              });
            });
          }

          // Handle 403 Forbidden errors
          if (error.data?.httpStatus === 403 || errorCode === 'FORBIDDEN') {
            console.error('Authorization error:', error);
            // Redirect to an appropriate page
            this.router.navigate(['/access-denied']);
          }
        }

        // Re-throw the error for further handling
        return throwError(() => error);
      })
    );
  }
}
