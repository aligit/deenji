// src/app/core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { Profile } from '../models/supabase.model';
import { UserSettings } from '../models/user.model';
import {
  IAuthService,
  ProfileUpdatePayload,
  UserProfileUpdatePayload,
  UserSettingsUpdatePayload,
  UserUpdateAttributes,
  AuthResponse,
  SavedProperty,
  DbResponse,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService implements IAuthService {
  // Public access to the Supabase client for direct operations
  public client: SupabaseClient;

  // Public session property for backwards compatibility
  public session: Session | null = null;

  // Session subject for reactive updates
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  constructor() {
    // Initialize the Supabase client with your project's URL and anon key
    this.client = createClient(
      import.meta.env['VITE_supabaseUrl'],
      import.meta.env['VITE_supabaseKey']
    );

    console.log('Supabase client initialized');

    // Initialize session state
    this.initSession();

    // Set up auth state change handler
    this.client.auth.onAuthStateChange((event, session) => {
      console.log(
        'Auth state changed:',
        event,
        session ? 'Authenticated' : 'Not authenticated'
      );
      this.updateSession(session);
    });
  }

  /**
   * Initialize session from stored value
   */
  private async initSession() {
    try {
      const { data } = await this.client.auth.getSession();
      this.updateSession(data.session);
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  }

  /**
   * Update session state
   */
  private updateSession(session: Session | null) {
    this.session = session;
    this.sessionSubject.next(session);
  }

  // ====== AUTHENTICATION METHODS ======

  /**
   * Get the current session
   */
  async getSession() {
    return this.client.auth.getSession();
  }

  /**
   * Listen for authentication state changes
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    return this.client.auth.onAuthStateChange(callback);
  }

  /**
   * Set session manually with tokens
   * Used primarily with magic link authentication
   */
  async setSession(accessToken: string, refreshToken: string) {
    const { data, error } = await this.client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('Error setting session:', error);
      throw error;
    }

    this.updateSession(data.session);
    return { data, error };
  }

  /**
   * Sign in with email (send OTP)
   */
  async signIn(email: string) {
    console.log('Sending OTP to email:', email);

    const { data, error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('Error sending OTP:', error);
    } else {
      console.log('OTP sent successfully');
    }

    return { data, error };
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(email: string, token: string) {
    console.log('Verifying OTP for email:', email);

    const { data, error } = await this.client.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error('Error verifying OTP:', error);
    } else {
      console.log('OTP verified successfully');
      // Update session if verification is successful
      if (data.session) {
        this.updateSession(data.session);
      }
    }

    return { data, error };
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    const result = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (result.data.session) {
      this.updateSession(result.data.session);
    }
    return result;
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    const result = await this.client.auth.signUp({ email, password });
    if (result.data.session) {
      this.updateSession(result.data.session);
    }
    return result;
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    const result = await this.client.auth.signOut();
    this.updateSession(null);
    return result;
  }

  /**
   * Update user data
   */
  async updateUser(updates: UserUpdateAttributes): Promise<AuthResponse> {
    const result = await this.client.auth.updateUser(updates);

    // Create the structure that matches AuthResponse
    const authResponse: AuthResponse = {
      data: {
        user: result.data.user,
        session: null,
      },
      error: result.error,
    };

    if (result.data.user) {
      // If user was updated, update our local session copy
      const { data } = await this.client.auth.getSession();
      this.updateSession(data.session);

      // Update the session in the response
      authResponse.data.session = data.session;
    }

    return authResponse;
  }

  // ====== PROFILE METHODS ======

  /**
   * Get user profile
   */
  async profile(user: User) {
    console.log('Loading profile for user:', user.id);

    const { data, error } = await this.client
      .from('profiles')
      .select('username, website, avatar_url, phone')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      console.log('Profile loaded:', data);
    }

    return { data, error } as DbResponse<Profile>;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: ProfileUpdatePayload) {
    console.log('Updating profile:', updates);

    const { id, ...profileData } = updates;

    const { data, error } = await this.client
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
    } else {
      console.log('Profile updated:', data);
    }

    return { data, error } as DbResponse<Profile>;
  }

  /**
   * Update full user profile (including phone)
   */
  async updateFullProfile(updates: UserProfileUpdatePayload) {
    console.log('Updating full profile:', updates);
    return this.updateProfile(updates as any);
  }

  /**
   * Update user settings
   */
  async updateUserSettings(updates: UserSettingsUpdatePayload) {
    console.log('Updating user settings:', updates);

    const { id, ...settings } = updates;

    const { data, error } = await this.client
      .from('user_settings')
      .upsert({
        user_id: id,
        ...settings,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
    } else {
      console.log('User settings updated:', data);
    }

    return { data, error } as DbResponse<UserSettings>;
  }

  // ====== PROPERTY METHODS ======

  /**
   * Get user saved properties
   */
  async getSavedProperties(
    userId: string
  ): Promise<DbResponse<SavedProperty[]>> {
    console.log('Loading saved properties for user:', userId);

    const { data, error } = await this.client
      .from('saved_properties')
      .select(
        `
        property_id,
        user_id,
        properties (*)
      `
      )
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching saved properties:', error);
    } else {
      console.log('Saved properties loaded:', data);
    }

    return { data, error } as DbResponse<SavedProperty[]>;
  }

  /**
   * Remove saved property
   */
  async removeSavedProperty(
    userId: string,
    propertyId: number
  ): Promise<DbResponse<null>> {
    console.log(`Removing saved property ${propertyId} for user ${userId}`);

    const { data, error } = await this.client
      .from('saved_properties')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId);

    if (error) {
      console.error('Error removing saved property:', error);
    } else {
      console.log('Saved property removed');
    }

    return { data: null, error } as DbResponse<null>;
  }
}
