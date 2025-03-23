# Deenji Real Estate Platform

Deenji is a modern real estate platform built with AnalogJS (Angular meta-framework), Supabase for authentication and data storage, and tRPC for type-safe API communication.

## Features

- 🏠 Property listing and browsing
- 👤 User accounts with profiles and preferences
- 🔒 Secure authentication via magic links
- 🌐 Multilingual support (Persian/Farsi by default)
- 📱 Responsive design for all devices
- 🔍 Advanced property search

## Tech Stack

- **Frontend**: AnalogJS (Angular), TailwindCSS, Spartan UI
- **Backend**: Supabase, tRPC, Drizzle ORM
- **Database**: PostgreSQL (via Supabase)

## Prerequisites

- Node.js 16+
- Bun package manager
- Supabase CLI

## Getting Started

### 1. Start Supabase locally

Before starting the application, you need to run a local Supabase instance. This provides authentication, database, and storage services.

```bash
# Start Supabase while excluding unnecessary services
bunx supabase start -x edge-runtime,vector,logflare
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following variables:

```
VITE_supabaseUrl=http://localhost:54321
VITE_supabaseKey=your-supabase-anon-key
```

You can find your anon key in the Supabase dashboard or in the terminal output after starting Supabase.

### 3. Start the Development Server

The project uses Nx for monorepo management. To start the development server:

```bash
# Start the development server
bunx nx s deenji
```

The application will be available at `http://localhost:4200`.

## Project Structure

- `/src/app` - Angular application code
  - `/core` - Core services, guards, and models
  - `/pages` - Page components following the AnalogJS file-based routing
  - `/shared` - Shared components like navbar and footer
- `/src/server` - Server-side code
  - `/routes` - API routes and endpoints
  - `/trpc` - tRPC router definitions

## Authentication Flow

Deenji uses Supabase's passwordless authentication with magic links:

1. User enters their email address
2. User receives a one-time password (OTP) via email
3. User verifies identity by entering the OTP
4. System creates user profile if it doesn't exist

## Database Migrations

To apply database migrations:

```bash
bunx supabase migration up
```

## Building for Production

```bash
bunx nx build deenji
```

## License

[MIT](LICENSE)
