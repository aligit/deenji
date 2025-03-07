// src/app/core/services/supabase.service.ts
import { Injectable, signal } from '@angular/core';
import {
  AuthSession,
  createClient,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { Profile } from '../models/supabase.model';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private sessionSignal = signal<AuthSession | null>(null);

  constructor() {
    const supabaseUrl = import.meta.env['VITE_supabaseUrl'];
    const supabaseKey = import.meta.env['VITE_supabaseKey'];
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key missing in environment variables.');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);

    this.supabase.auth.getSession().then(({ data }) => {
      this.sessionSignal.set(data.session);
    });

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      this.sessionSignal.set(session);
    });
  }

  get session() {
    return this.sessionSignal.asReadonly();
  }

  profile(user: User) {
    return this.supabase
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', user.id)
      .single();
  }

  async signIn(email: string) {
    // Get the base URL for redirection - must be dynamically determined
    const baseUrl = window.location.origin;

    return this.supabase.auth.signInWithOtp({
      email,
      options: {
        // Use dynamic origin instead of hardcoded localhost
        emailRedirectTo: `${baseUrl}/confirm`,
        // Explicitly prefer OTP verification method over magic link
        shouldCreateUser: true,
      },
    });
  }

  async verifyOtp(email: string, token: string) {
    return this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    };
    return this.supabase.from('profiles').upsert(update);
  }

  downloadImage(path: string) {
    return this.supabase.storage.from('avatars').download(path);
  }

  uploadAvatar(filePath: string, file: File) {
    return this.supabase.storage.from('avatars').upload(filePath, file);
  }
}
