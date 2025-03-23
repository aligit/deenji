// src/app/core/services/account-settings.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UserService } from './user.service';
import {
  BehaviorSubject,
  Observable,
  catchError,
  forkJoin,
  from,
  map,
  of,
  tap,
} from 'rxjs';
import { UserProfile, UserSettings } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AccountSettingsService {
  private supabaseService = inject(SupabaseService);
  private userService = inject(UserService);

  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  private settingsSubject = new BehaviorSubject<UserSettings | null>(null);

  profile$ = this.profileSubject.asObservable();
  settings$ = this.settingsSubject.asObservable();

  loadUserData(userId: string): Observable<boolean> {
    const profileRequest = this.userService.getProfile(userId).pipe(
      tap((profile) => this.profileSubject.next(profile)),
      catchError((err) => {
        console.error('Error loading profile:', err);
        return of(null);
      })
    );

    const settingsRequest = this.userService.getSettings(userId).pipe(
      tap((settings) => this.settingsSubject.next(settings)),
      catchError((err) => {
        console.error('Error loading settings:', err);
        return of(null);
      })
    );

    // Use forkJoin to run both requests in parallel
    return forkJoin([profileRequest, settingsRequest]).pipe(
      map(() => true),
      catchError((err) => {
        console.error('Error loading user data:', err);
        return of(false);
      })
    );
  }

  updateProfile(
    profile: UserProfile & { id: string }
  ): Observable<UserProfile> {
    return this.userService.updateProfile(profile).pipe(
      tap((updatedProfile) => {
        this.profileSubject.next(updatedProfile);
      })
    );
  }

  updateSettings(settings: UserSettings): Observable<UserSettings> {
    return this.userService.updateSettings(settings).pipe(
      tap((updatedSettings) => {
        this.settingsSubject.next(updatedSettings);
      })
    );
  }

  // Direct method using SupabaseService
  async updateProfileDirect(
    profile: Partial<UserProfile> & { id: string }
  ): Promise<any> {
    try {
      const result = await this.supabaseService.updateFullProfile(profile);
      return result;
    } catch (error) {
      console.error('Error updating profile directly:', error);
      throw error;
    }
  }

  // Direct method using SupabaseService
  async updateSettingsDirect(settings: Partial<UserSettings>): Promise<any> {
    try {
      const result = await this.supabaseService.updateUserSettings(settings);
      return result;
    } catch (error) {
      console.error('Error updating settings directly:', error);
      throw error;
    }
  }
}
