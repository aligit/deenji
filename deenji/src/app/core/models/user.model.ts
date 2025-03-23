export interface UserSettings {
  id: string;
  language?: string;
  email_notifications?: boolean;
  property_alerts?: boolean;
  price_drop_alerts?: boolean;
  dark_mode?: boolean;
}

export interface UserProfile {
  username: string;
  website?: string;
  phone?: string;
  avatar_url?: string;
  user_type?: 'buyer' | 'agent';
  email_verified?: boolean;
}
