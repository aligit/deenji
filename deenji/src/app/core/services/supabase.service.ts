import { Injectable } from "@angular/core";
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { Profile } from "../models/supabase.model";

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  private readonly supabaseUrl = import.meta.env["VITE_supabaseUrl"];
  private readonly supabaseKey = import.meta.env["VITE_supabaseKey"];
  private supabase: SupabaseClient;
  _session: AuthSession | null = null;

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  get session() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session;
    });
    return this._session;
  }

  profile(user: User) {
    return this.supabase
      .from("profiles")
      .select(`username, website, avatar_url`)
      .eq("id", user.id)
      .single();
  }

  authChanges(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
  // Updated login with password
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  signIn(email: string) {
    return this.supabase.auth.signInWithOtp({ email });
  }

  // Updated signup with email/password and optional phone
  async signUp(email: string, password: string, phone?: string) {
    const authData: any = { email, password };
    if (phone) authData.phone = phone; // Add phone if provided
    const { data, error } = await this.supabase.auth.signUp(authData);
    if (error) throw error;
    return data;
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    };

    return this.supabase.from("profiles").upsert(update);
  }

  downLoadImage(path: string) {
    return this.supabase.storage.from("avatars").download(path);
  }

  uploadAvatar(filePath: string, file: File) {
    return this.supabase.storage.from("avatars").upload(filePath, file);
  }
}
