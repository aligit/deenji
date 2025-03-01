// src/app/core/services/supabase.service.ts
import { Injectable, signal } from "@angular/core";
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

export interface Profile {
  id?: string;
  username: string;
  website: string;
  avatar_url: string;
}

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private sessionSignal = signal<AuthSession | null>(null);

  constructor() {
    const supabaseUrl = import.meta.env["VITE_supabaseUrl"];
    const supabaseKey = import.meta.env["VITE_supabaseKey"];
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL or Key missing in environment variables.");
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);

    this.supabase.auth.getSession().then(({ data }) => {
      this.sessionSignal.set(data.session);
    });

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      this.sessionSignal.set(session);
    });
  }

  get session() {
    return this.sessionSignal.asReadonly();
  }

  profile(user: User) {
    return this.supabase
      .from("profiles")
      .select(`username, website, avatar_url`)
      .eq("id", user.id)
      .single();
  }

  async signIn(email: string) {
    //TODO: replace using environment variable
    return this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:4200/auth/confirm", // Redirect to confirmation route
      },
    });
  }

  async verifyMagicLinkToken(tokenHash: string) {
    const { error } = await this.supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (error) throw error;
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    };
    return this.supabase.from("profiles").upsert(update);
  }

  downloadImage(path: string) {
    return this.supabase.storage.from("avatars").download(path);
  }

  uploadAvatar(filePath: string, file: File) {
    return this.supabase.storage.from("avatars").upload(filePath, file);
  }
}
