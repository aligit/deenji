import { Injectable } from '@angular/core';
import {
  Session,
  createClient,
  SupabaseClient,
  User,
  AuthChangeEvent,
} from '@supabase/supabase-js';
import { Profile } from '../models/supabase.model';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private _session: Session | null = null;

  constructor() {
    const supabaseUrl = import.meta.env['VITE_supabaseUrl'];
    const supabaseKey = import.meta.env['VITE_supabaseKey'];
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.loadSession(); // Load session on initialization
  }

  private async loadSession() {
    const { data } = await this.supabase.auth.getSession();
    this._session = data.session;
    // Set up listener for auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      this._session = session;
    });
  }

  get session(): Session | null {
    return this._session;
  }

  profile(user: User) {
    return this.supabase
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', user.id)
      .single();
  }

  async signIn(email: string) {
    const baseUrl = window.location.origin;
    return this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${baseUrl}/confirm`,
        shouldCreateUser: true,
      },
    });
  }

  async verifyOtp(email: string, token: string) {
    return this.supabase.auth.verifyOtp({ email, token, type: 'email' });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  // Add this new method to set the session from tokens
  async setSession(accessToken: string, refreshToken: string) {
    const { data, error } = await this.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('Error setting session:', error);
      throw error;
    }

    this._session = data.session;
    return { data, error };
  }

  updateProfile(profile: Profile) {
    const update = { ...profile, updated_at: new Date() };
    return this.supabase.from('profiles').upsert(update);
  }

  downloadImage(path: string) {
    return this.supabase.storage.from('avatars').download(path);
  }

  uploadAvatar(filePath: string, file: File) {
    return this.supabase.storage.from('avatars').upload(filePath, file);
  }

  // Expose getSession method
  async getSession(): Promise<{ data: { session: Session | null } }> {
    return this.supabase.auth.getSession();
  }

  // Expose onAuthStateChange method
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}
