// src/app/core/models/auth.model.ts
import { User, Session } from '@supabase/supabase-js';
import { Profile } from './supabase.model';
import { UserProfile, UserSettings } from './user.model';

// Auth response types
export interface AuthOtpResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: Error | null;
}

export interface AuthTokenResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: Error | null;
}

export interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: Error | null;
}

// Type for user update properties
export interface UserUpdateAttributes {
  email?: string;
  password?: string;
  phone?: string;
  email_confirm?: boolean;
  phone_confirm?: boolean;
  data?: Record<string, any>;
}

// Property types
export interface SavedProperty {
  property_id: number;
  user_id: string;
  properties: Record<string, any>; // This could be more specific based on your data structure
}

// Database response types
export interface DbResponse<T> {
  data: T | null;
  error: Error | null;
}

// Request payload types
export interface ProfileUpdatePayload extends Partial<Profile> {
  id: string;
}

export interface UserProfileUpdatePayload extends Partial<UserProfile> {
  id: string;
}

export interface UserSettingsUpdatePayload extends Partial<UserSettings> {
  id: string;
}

// Auth service interface (for better type definitions)
export interface IAuthService {
  // Session management
  getSession(): Promise<{
    data: { session: Session | null };
    error: Error | null;
  }>;
  setSession(
    accessToken: string,
    refreshToken: string
  ): Promise<AuthTokenResponse>;
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): { data: { subscription: any } };

  // Authentication methods
  signIn(email: string): Promise<AuthOtpResponse>;
  verifyOtp(email: string, token: string): Promise<AuthTokenResponse>;
  signInWithPassword(email: string, password: string): Promise<AuthResponse>;
  signUp(email: string, password: string): Promise<AuthResponse>;
  signOut(): Promise<{ error: Error | null }>;
  updateUser(updates: UserUpdateAttributes): Promise<AuthResponse>;

  // Profile methods
  profile(user: User): Promise<DbResponse<Profile>>;
  updateProfile(updates: ProfileUpdatePayload): Promise<DbResponse<Profile>>;
  updateFullProfile(
    updates: UserProfileUpdatePayload
  ): Promise<DbResponse<Profile>>;

  // Settings methods
  updateUserSettings(
    updates: UserSettingsUpdatePayload
  ): Promise<DbResponse<any>>;

  // Property methods
  getSavedProperties(userId: string): Promise<DbResponse<SavedProperty[]>>;
  removeSavedProperty(
    userId: string,
    propertyId: number
  ): Promise<DbResponse<null>>;
}
