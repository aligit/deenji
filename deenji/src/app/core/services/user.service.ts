// src/app/core/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { injectTrpcClient } from '../../../trpc-client';
import { UserProfile, UserSettings } from '../models/user.model';
import { AuthInterceptorService } from './auth-interceptor.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _trpc = injectTrpcClient();
  private authInterceptor = inject(AuthInterceptorService);
  private supabaseService = inject(SupabaseService);

  /**
   * Get current user ID from Supabase session
   */
  private getCurrentUserId(): string | null {
    return this.supabaseService.session?.user?.id || null;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getCurrentUserId();
  }

  /**
   * Get user's profile
   */
  getProfile(userId?: string): Observable<UserProfile> {
    // Use current user ID if none provided
    const id = userId || this.getCurrentUserId();

    if (!id) {
      return throwError(() => new Error('No authenticated user found'));
    }

    return from(this._trpc.user.getProfile.query({ userId: id })).pipe(
      this.authInterceptor.handleTrpcErrors,
      catchError((err) => {
        console.error('Error fetching user profile:', err);
        return throwError(() => new Error('Failed to load user profile'));
      })
    );
  }

  /**
   * Update user's profile
   */
  updateProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    const userId = this.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('No authenticated user found'));
    }

    // Always use the current user's ID to prevent updating other profiles
    const updatedProfile = {
      ...profile,
      id: userId,
    };

    return from(this._trpc.user.updateProfile.mutate(updatedProfile)).pipe(
      this.authInterceptor.handleTrpcErrors,
      catchError((err) => {
        console.error('Error updating user profile:', err);
        return throwError(() => new Error('Failed to update user profile'));
      })
    );
  }

  /**
   * Get user's settings
   */
  getSettings(userId?: string): Observable<UserSettings> {
    const id = userId || this.getCurrentUserId();

    if (!id) {
      return throwError(() => new Error('No authenticated user found'));
    }

    return from(this._trpc.user.getSettings.query({ userId: id })).pipe(
      this.authInterceptor.handleTrpcErrors,
      catchError((err) => {
        console.error('Error fetching user settings:', err);
        return throwError(() => new Error('Failed to load user settings'));
      })
    );
  }

  /**
   * Update user's settings
   */
  updateSettings(settings: Partial<UserSettings>): Observable<UserSettings> {
    const userId = this.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('No authenticated user found'));
    }

    // Always use the current user's ID to prevent updating other users' settings
    const updatedSettings = {
      ...settings,
      id: userId,
    };

    return from(this._trpc.user.updateSettings.mutate(updatedSettings)).pipe(
      this.authInterceptor.handleTrpcErrors,
      catchError((err) => {
        console.error('Error updating user settings:', err);
        return throwError(() => new Error('Failed to update user settings'));
      })
    );
  }

  /**
   * Check authentication status
   */
  getAuthStatus(): Observable<{
    isAuthenticated: boolean;
    userId: string | undefined;
  }> {
    return from(this._trpc.user.getAuthStatus.query()).pipe(
      catchError((err) => {
        console.error('Error checking auth status:', err);
        return throwError(
          () => new Error('Failed to check authentication status')
        );
      })
    );
  }
}
