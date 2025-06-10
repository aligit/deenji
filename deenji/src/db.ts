import { drizzle } from 'drizzle-orm/postgres-js';
import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  boolean,
  varchar,
  pgEnum,
  bigint,
  smallint,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import postgres from 'postgres';

// Existing notes table
export const notes = pgTable('note', {
  id: serial('id').primaryKey(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User type enum
export const userTypeEnum = pgEnum('user_type', ['buyer', 'agent']);

// Profiles table (extended)
export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .notNull()
    .references(() => auth.users.id, { onDelete: 'cascade' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  username: text('username').unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  website: text('website'),
  phone: varchar('phone', { length: 20 }),
  userType: userTypeEnum('user_type'),
  emailVerified: boolean('email_verified').default(false),
});

// User settings table
export const userSettings = pgTable('user_settings', {
  id: uuid('id')
    .primaryKey()
    .notNull()
    .references(() => auth.users.id, { onDelete: 'cascade' }),
  language: varchar('language', { length: 10 }).default('fa'),
  emailNotifications: boolean('email_notifications').default(true),
  propertyAlerts: boolean('property_alerts').default(true),
  priceDropAlerts: boolean('price_drop_alerts').default(false),
  darkMode: boolean('dark_mode').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const properties = pgTable('properties', {
  id: bigint('id', { mode: 'number' }).primaryKey().notNull(),
  // Other fields
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  propertyId: bigint('property_id', { mode: 'number' })
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  rating: smallint('rating'),
  comment: text('comment'),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type definitions for profiles
export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;

// Type definitions for user settings
export type UserSettings = InferSelectModel<typeof userSettings>;
export type NewUserSettings = InferInsertModel<typeof userSettings>;

export type Property = InferSelectModel<typeof properties>;
export type NewProperty = InferInsertModel<typeof properties>;

// Type definitions for notes (existing)
export type Note = InferSelectModel<typeof notes>;
export type NewNote = InferInsertModel<typeof notes>;

// Auth users reference (for foreign keys)
const auth = {
  users: pgTable('users', {
    id: uuid('id').primaryKey().notNull(),
  }),
};

// Database connection
const client = postgres(process.env['DATABASE_URL'] ?? '');
export const db = drizzle(client);
