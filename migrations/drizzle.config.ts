// apps/migrations/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: '../deenji/src/db.ts', // Path to your PostgreSQL schema
  out: './drizzle', // Output directory for migrations
  dialect: 'postgresql', // Use Bun's PostgreSQL driver
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
