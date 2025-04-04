# Deenji Real Estate Platform

Creates a properly structured Elasticsearch index for properties
Maps PostgreSQL data to the correct format for Elasticsearch
Handles bulk indexing for performance
Properly extracts amenities from your attributes array
Includes handling for Persian text and numbers

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
- **Search**: Elasticsearch for property search and filtering

## Prerequisites

- Node.js 16+
- Bun package manager
- Supabase CLI
- Python 3.11+ (for VectorCode)

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

### Authentication and Authorization with Supabase and tRPC

#### Overview

Our application uses Supabase for authentication and tRPC for type-safe API communication. The authentication flow works by:

1. Users authenticate with Supabase (via email OTP)
2. The Supabase session provides an auth token
3. Our Angular app passes this token to tRPC requests
4. The tRPC backend verifies this token with Supabase
5. Middleware enforces appropriate access controls

#### Security Levels

We have three levels of authorization in our tRPC endpoints:

- **publicProcedure**: Available to anyone, authenticated or not
- **protectedProcedure**: Only available to authenticated users
- **userProcedure**: Only allows users to access their own data

#### Adding New Secure Routes

When adding new endpoints to tRPC:

1. Choose the appropriate security level for your endpoint:

```typescript
// Public endpoint (anyone can access)
myPublicEndpoint: publicProcedure
  .query(() => { ... })

// Protected endpoint (authenticated users only)
myProtectedEndpoint: protectedProcedure
  .query(() => { ... })

// User-specific endpoint (users can only access their own data)
myUserEndpoint: userProcedure
  .input(z.object({ userId: z.string().uuid() }))
  .query(({ input, ctx }) => {
    // ctx.user is guaranteed to be available and authenticated
    // input.userId is guaranteed to match ctx.user.id
    ...
  })
```

2. For user-specific endpoints, use the userProcedure and include userId in the input

3. Always access the authenticated user through ctx.user, never trust client-provided data

4. Use the TRPCError with appropriate error codes:

```typescript
throw new TRPCError({
  code: 'UNAUTHORIZED', // For authentication failures
  message: 'You must be logged in to access this resource',
});

// Or
throw new TRPCError({
  code: 'FORBIDDEN', // For authorization failures
  message: 'You can only access your own data',
});
```

## Database Migrations

To apply database migrations:

```bash
bunx supabase migration up
```

## Database schema

```bash
pg_dump "postgresql://postgres:postgres@127.0.0.1:54322/postgres" --schema-only > deenji_schema.sql
```

## Building for Production

```bash
bunx nx build deenji
```

## Index Data for elasticsearch

### First time

```bash
cd ./migrations
ELASTICSEARCH_URL=http://localhost:9200 bun run src/elasticsearch-sync.ts --recreate-index
```

### Otherwise

```bash
cd ./migrations
ELASTICSEARCH_URL=http://localhost:9200 bun run src/elasticsearch-sync.ts
```

## Using VectorCode for Development

VectorCode is a semantic code search tool that helps developers navigate and understand the codebase. It's especially useful for new team members and when implementing new features that interact with multiple parts of the system.

### Installation

Install VectorCode using Python's virtual environment:

```bash
# Create a virtual environment
python3 -m venv ~/vectorcode-env

# Activate the environment
source ~/vectorcode-env/bin/activate

# Install VectorCode
pip install vectorcode
```

For easier access, consider adding an alias to your shell profile:

```bash
# Add to your .bashrc or .zshrc
alias vectorcode="~/vectorcode-env/bin/vectorcode"
```

### Initializing VectorCode for the Project

```bash
# From the project root
source ~/vectorcode-env/bin/activate  # If not already activated
vectorcode init
```

### Indexing the Codebase

```bash
# Index TypeScript and HTML files
vectorcode vectorise "src/**/*.ts" "src/**/*.html"

# For targeted indexing of specific components (e.g., search functionality)
vectorcode vectorise "src/app/pages/home/sticky-search.component.ts" "src/server/trpc/routers/search.ts"
```

### Semantic Code Search

Find relevant files when implementing or understanding features:

```bash
# Find files related to authentication
vectorcode query "authentication flow supabase" -n 5

# Find files related to property search
vectorcode query "elasticsearch property search" -n 5

# Find RTL support implementation
vectorcode query "RTL Persian language support" -n 5
```

### Using VectorCode with CodeCompanion Workspace

For developers using Neovim with CodeCompanion, you can enhance your development experience by creating a structured workspace based on VectorCode searches:

1. Create a workspace file:

   ```bash
   # From project root
   cp .vectorcode/config.json codecompanion-workspace.json
   ```

2. Use VectorCode to find relevant files for features:

   ```bash
   # Example: When working on search functionality
   vectorcode query "property search elasticsearch" -n 8
   ```

3. Update your workspace file with these results

4. In Neovim, use `:CodeCompanionActions` and select "Workspace File" to work with your workspace

### Keeping VectorCode Updated

As the codebase evolves, periodically update your VectorCode index:

```bash
# Update all indexed files
vectorcode update
```

## License

[MIT](LICENSE)
