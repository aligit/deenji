// src/app/core/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { injectTrpcClient } from '../../../trpc-client';
import { UserProfile, UserSettings } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _trpc = injectTrpcClient();

  getProfile(userId: string): Observable<UserProfile> {
    return from(this._trpc.user.getProfile.query({ userId })).pipe(
      catchError((err) => {
        console.error('Error fetching user profile:', err);
        return throwError(() => new Error('Failed to load user profile'));
      })
    );
  }

  updateProfile(
    profile: UserProfile & { id: string }
  ): Observable<UserProfile> {
    return from(this._trpc.user.updateProfile.mutate(profile)).pipe(
      catchError((err) => {
        console.error('Error updating user profile:', err);
        return throwError(() => new Error('Failed to update user profile'));
      })
    );
  }

  getSettings(userId: string): Observable<UserSettings> {
    return from(this._trpc.user.getSettings.query({ userId })).pipe(
      catchError((err) => {
        console.error('Error fetching user settings:', err);
        return throwError(() => new Error('Failed to load user settings'));
      })
    );
  }

  updateSettings(settings: UserSettings): Observable<UserSettings> {
    return from(this._trpc.user.updateSettings.mutate(settings)).pipe(
      catchError((err) => {
        console.error('Error updating user settings:', err);
        return throwError(() => new Error('Failed to update user settings'));
      })
    );
  }
}
