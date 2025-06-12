// src/app/core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';

export interface ProfileUpdateData {
  id: string;
  username?: string;
  website?: string;
  avatar_url?: string;
  phone?: string;
}

export interface UserSettingsUpdateData {
  id: string;
  language: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
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
   * Reset password for email
   */
  async resetPasswordForEmail(email: string) {
    return this.client.auth.resetPasswordForEmail(email);
  }

  /**
   * Update user data
   */
  async updateUser(updates: any) {
    const result = await this.client.auth.updateUser(updates);
    if (result.data.user) {
      // If session was updated, update our local copy
      const { data } = await this.client.auth.getSession();
      this.updateSession(data.session);
    }
    return result;
  }

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

    return { data, error };
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: ProfileUpdateData) {
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

    return { data, error };
  }

  /**
   * Update full user profile (including phone)
   */
  async updateFullProfile(updates: ProfileUpdateData) {
    console.log('Updating full profile:', updates);
    return this.updateProfile(updates);
  }

  /**
   * Update user settings
   */
  async updateUserSettings(updates: UserSettingsUpdateData) {
    console.log('Updating user settings:', updates);

    const { id, language } = updates;

    const { data, error } = await this.client
      .from('user_settings')
      .upsert({
        user_id: id,
        language,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
    } else {
      console.log('User settings updated:', data);
    }

    return { data, error };
  }

  /**
   * Get user saved properties
   */
  async getSavedProperties(userId: string) {
    console.log('Loading saved properties for user:', userId);

    const { data, error } = await this.client
      .from('saved_properties')
      .select(
        `
        property_id,
        properties (*)
      `
      )
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching saved properties:', error);
    } else {
      console.log('Saved properties loaded:', data);
    }

    return { data, error };
  }

  /**
   * Remove saved property
   */
  async removeSavedProperty(userId: string, propertyId: number) {
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

    return { data, error };
  }
}
