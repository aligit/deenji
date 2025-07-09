# Deenji Real Estate Platform

Deenji is a modern real estate platform built with AnalogJS (Angular meta-framework), Supabase for authentication and data storage, and tRPC for type-safe API communication. This platform leverages AI-assisted development tools like CodeCompanion and VectorCode for enhanced productivity.

## Features

- 🏠 Property listing and browsing
- 👤 User accounts with profiles and preferences
- 🔒 Secure authentication via magic links
- 🌐 Multilingual support (Persian/Farsi by default)
- 📱 Responsive design for all devices
- 🔍 Advanced property search powered by Elasticsearch
- ✨ AI-assisted development with CodeCompanion & VectorCode

## Tech Stack

- **Frontend**: AnalogJS (Angular), TailwindCSS, Spartan UI
- **Backend**: Supabase, tRPC, Drizzle ORM
- **Database**: PostgreSQL (via Supabase)
- **Search**: Elasticsearch for property search and filtering
- **AI Development Tools**: CodeCompanion.nvim, VectorCode

## Prerequisites

- Node.js 16+
- Bun package manager
- Supabase CLI
- Python 3.11+
- `pipx` (for isolated Python tool installation, recommended for VectorCode)

## Getting Started

### 1. Start Supabase locally

```bash
# Start Supabase while excluding unnecessary services
bunx supabase start -x edge-runtime,vector,logflare
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```
VITE_supabaseUrl=http://localhost:54321
VITE_supabaseKey=your-supabase-anon-key
```

(Find your anon key from Supabase CLI output or dashboard)

### 3. Start the Development Server

```bash
# Start the development server
bunx nx s deenji
```

#### Create a component via nx

```bash
bunx nx generate @nx/angular:component \
  --name=search-suggestion \
  --path=deenji/src/app/pages/home/search-suggestion \
  --standalone \
  --inlineTemplate \
  --inlineStyle \
  --skipTests
```

App available at `http://localhost:4200`.

### 4. Run tests

```bash
# Run tests from deenji directory
bun nx test deenji
```

## Project Structure

- `/src/app` - Angular application code
- `/src/server` - Server-side code (tRPC, services)
- `/docs` - Documentation, including search and integration details
- `/.vectorcode` - VectorCode project-specific configuration and data
- `/codecompanion-workspace.json` - Context file for CodeCompanion AI assistant

## Elasticsearch & Database

### Elasticsearch Schema

```sh
# Get current Elasticsearch schema (ensure ES is running)
curl -X GET "http://localhost:9200/_all" > elasticsearch_schema.json
```

### Elasticsearch Search Examples

```sh
# Example 1: Search for properties with prefix "آپ" (beginning of "آپارتمان"/apartment)
curl -X GET "http://localhost:9200/divar_properties/_search" -H 'Content-Type: application/json' -d '{
  "query": {
       "multi_match": {
         "query": "آپ",
         "type": "bool_prefix",
         "fields": ["property_type", "property_type.ngram"]
       }
  }
}' | jq '.hits.total.value, .hits.hits[]._source.title'
```

Example output:

```
"آپارتمان خوش ساخت مناسب سکونت ویا سرمایه گذاری"
```

```sh
# Example 2: Search for properties with prefix "وی"
curl -X GET "http://localhost:9200/divar_properties/_search" -H 'Content-Type: application/json' -d '{
  "query": {
       "multi_match": {
         "query": "وی",
         "type": "bool_prefix",
         "fields": ["property_type", "property_type.ngram"]
       }
  }
}' | jq '.hits.total.value, .hits.hits[]._source.title'
```

### Database Migrations

```bash
bunx supabase migration up
```

### Database Schema Dump

```bash
# Ensure Supabase is running locally
pg_dump "postgresql://postgres:postgres@127.0.0.1:54322/postgres" --schema-only > deenji_schema.sql
```

### Indexing Data for Elasticsearch

**First time (or to recreate index):**

```bash
cd ./migrations
ELASTICSEARCH_URL=http://localhost:9200 bun run src/elasticsearch-sync.ts --recreate-index
```

**Subsequent updates:**

```bash
cd ./migrations
ELASTICSEARCH_URL=http://localhost:9200 bun run src/elasticsearch-sync.ts
```

## AI-Assisted Development with CodeCompanion & VectorCode (Neovim)

This project is enhanced for AI-assisted development using CodeCompanion.nvim and VectorCode for semantic code search within Neovim.

### 1. Setup VectorCode CLI

VectorCode provides semantic search capabilities for your codebase.

**Installation (using `pipx` for isolated environment):**

```bash
pipx install vectorcode --force
# Or for CPU-only PyTorch (if CUDA issues):
# PIP_INDEX_URL="https://download.pytorch.org/whl/cpu" PIP_EXTRA_INDEX_URL="https://pypi.org/simple" pipx install vectorcode --force
```

Ensure `pipx` binaries are in your `PATH`.

**Initialize & Index Project (run once per project, then update):**
From the `Deenji` project root:

```bash
# Initialize VectorCode for this project
vectorcode init

# Configure (Optional but Recommended)
# Edit .vectorcode/config.json5 (create if not exists) with settings like:
# {
#   "embedding_function": "SentenceTransformerEmbeddingFunction",
#   "chunk_size": 1500,
#   "overlap_ratio": 0.25,
#   "reranker": "CrossEncoderReranker",
#   "reranker_params": { "model_name_or_path": "cross-encoder/ms-marco-MiniLM-L-6-v2" }
# }
# (Refer to VectorCode docs for full configuration options)

# Initial Indexing (adjust globs as needed for relevant source code)
vectorcode vectorise "deenji/src/**/*.{ts,tsx,js,jsx}" "docs/**/*.md"
```

**Keeping Index Updated:**
As the codebase evolves, periodically update your VectorCode index:

```bash
vectorcode update # Updates all previously indexed files
# Or re-vectorise specific files/directories:
# vectorcode vectorise deenji/src/server/services/your-changed-service.ts
```

### 2. Setup CodeCompanion.nvim (with VectorCode Extension)

Ensure your Neovim (AstroNvim or similar `lazy.nvim` based config) includes:

- **`Davidyz/VectorCode` Neovim plugin:**
  - In your `lazy.nvim` plugin specs (e.g., `lua/user/plugins/vectorcode.lua`):
  ```lua
  return {
    "Davidyz/VectorCode",
    build = "pipx install --force vectorcode", -- Keeps CLI updated with plugin
    dependencies = { "nvim-lua/plenary.nvim" },
    opts = { /* VectorCode Neovim plugin opts */ },
    config = function(_, opts)
      pcall(require, "vectorcode")
      require("vectorcode").setup(opts)
    end,
  }
  ```
- **`olimorris/codecompanion.nvim` with VectorCode extension enabled:**
  - In your CodeCompanion plugin spec (e.g., `lua/user/plugins/codecompanion.lua`):
  ```lua
  return {
    "olimorris/codecompanion.nvim",
    dependencies = { /* ..., */ "Davidyz/VectorCode" },
    opts = function(_, opts)
      local cc_opts = {
        -- ... your adapters, strategies ...
        extensions = {
          vectorcode = {
            opts = { add_tool = true }, -- Enables @vectorcode tool
          },
          -- ... other extensions like history ...
        },
      }
      return cc_opts
    end,
    config = function(_, resolved_opts)
      require("codecompanion").setup(resolved_opts)
    end,
    -- ... your keys ...
  }
  ```

Refer to your specific Neovim configuration files for the exact placement.

### 3. Using `@vectorcode` Tool in CodeCompanion

Once set up and your project is indexed by VectorCode:

1.  **Ensure Neovim's Current Working Directory (`:pwd`) is your project root.**
2.  **Open CodeCompanion Chat:** Use your keybinding (e.g., `<leader>ut`).
3.  **Query your codebase via the LLM:**
    ```
    @vectorcode Find components that handle property search functionality
    ```
    ```
    @vectorcode Show me the tRPC router definitions related to user profiles
    ```
    CodeCompanion will use VectorCode to find relevant code snippets and provide them as context to the LLM, enabling more accurate and context-aware AI assistance.

### 4. Using `codecompanion-workspace.json`

This file (located in the project root) provides structured, high-level context about the project to CodeCompanion. It helps the LLM understand different modules, architectural decisions, and key files without needing to read everything initially.

**How to Use:**

1.  **Review and Update:** Keep `codecompanion-workspace.json` updated as your project evolves. Add new groups for major features or refactor existing ones.
2.  **Load Workspace Context in Chat:**
    - `:CodeCompanionChat`
    - Type `/workspace` and select a relevant group (e.g., "Search Backend Implementation", "Database Schema (PostgreSQL)").
3.  **Prompt the LLM:** With the workspace context loaded, ask specific questions or request code generation related to that area.
    ```
    /workspace Search Backend Implementation
    Now, help me implement the bedroom filter endpoint in the tRPC search router.
    ```
    The LLM will use the system prompt and file descriptions from the selected workspace group. If it needs full file content, it might ask, or you can provide it using `/file <path>` or instruct it to use `@files` (if the tool is configured and capable).

### Key CodeCompanion Commands/Features for This Workflow:

- `:CodeCompanionChat` (or keybinding): Open/toggle the chat.
- `@vectorcode <query>`: Perform a semantic search on your indexed codebase.
- `/workspace <GroupName>`: Load a predefined context group.
- `/file <path>`: Add content of a specific file to the chat.
- `#buffer{watch}` or `#buffer{pin}`: Keep the LLM updated on an active buffer.
- `@editor`: Instruct the LLM to attempt modifications to a watched/pinned buffer. (Use `ga` in diff view to accept changes).
- `:CodeCompanionActions` (or keybinding): Access various prompts and actions.

## Building for Production

```bash
bunx nx build deenji
```

## Re-Installing a Spartan UI Primitive with Brain & Helm

If you ever delete a primitive (e.g. `ui-select-helm`) and then get a “Skipping … already installed” error, follow these steps to remove any lingering imports/config and then re-generate the primitive with both the “brain” and “helm” libraries.

---

### 1. Find & Remove Old Imports

Anywhere your app still references the old Helm package will block regeneration. In your workspace root run:

```bash
# adjust the path to your app(s) as needed
grep -R "ui-select-helm\|@spartan-ng/helm/select" -n apps/
```

## License

[MIT](LICENSE)
