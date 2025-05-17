Okay, let's expand that into a more comprehensive "AI-Powered Development Workflow with CodeCompanion in Neovim" guide. This will serve as a quick reference for leveraging CodeCompanion's features, including VectorCode, `@editor`, `#buffer{watch/pin}`, `/workspace`, and more, directly within Neovim.

---

## AI-Powered Development Workflow with CodeCompanion in Neovim

This guide provides a quick reference for leveraging CodeCompanion.nvim and its integrations (like VectorCode) to accelerate development, understand code, and get AI assistance directly within your Neovim environment.

### I. Core CodeCompanion Setup & Keybindings

_(Assume CodeCompanion.nvim is installed and configured via `lazy.nvim` as previously discussed. Keybindings below are examples; adjust to your AstroNvim/personal setup.)_

**Essential Keybindings (Examples):**

- `<leader>ut` or `<LocalLeader>a`: `:CodeCompanionChat Toggle` (Toggle main chat window)
- `<leader>ue` or `gc` (visual mode): `:CodeCompanion ` (Opens inline assistant with prompt; use `:'<,'>CodeCompanion` for visual selection)
- `<leader>cca`: `:CodeCompanionActions` (Access prompt library, workflows, open chats)
- Chat Buffer (Normal Mode):
  - `<CR>` or `<C-s>`: Send message
  - `ga` (in diff): Accept change from `@editor` or inline assistant
  - `gr` (in diff): Reject change
  - `gy`: Yank last code block
  - `gd`: Debug chat (see full messages, adapter settings)
  - `?`: Show all chat buffer keymaps

### II. Understanding & Navigating Code

**A. Semantic Code Search with `@vectorcode` (Requires VectorCode Setup)**

1.  **Prerequisite:** VectorCode CLI installed, project initialized (`vectorcode init`), and relevant files indexed (`vectorcode vectorise ...`).
2.  **Usage:** In CodeCompanion Chat:
    - `@vectorcode <your natural language query about code>`
    - _Example:_ `@vectorcode find functions related to user authentication in tRPC routers`
    - _Example:_ `@vectorcode show me how the `PropertyFilters` type is used in the search service`
3.  **Outcome:** VectorCode searches its index. Relevant code snippets are provided as context to the LLM in the chat.

**B. Using `/workspace` for High-Level Project Context**

1.  **Prerequisite:** `codecompanion-workspace.json` file in project root, defining logical groups of files and descriptions.
2.  **Usage:** In CodeCompanion Chat:
    - `/workspace` (opens a picker if multiple groups exist, or auto-completes if unique)
    - Select a group, e.g., "Search Backend Implementation" or "Database Schema (PostgreSQL)".
3.  **Outcome:** The LLM receives the system prompt and data item descriptions for that group, providing high-level context for subsequent questions or tasks.
    - _Example after loading "Search Backend Implementation":_ "Explain the role of `suggestion.service.ts` in this architecture."

**C. Explaining Code Snippets or Files**

1.  **Visual Selection:**
    - Visually select a piece of code in any buffer.
    - Run `:CodeCompanion /explain` (uses a pre-defined prompt from the library).
    - Or, with the selection active: `<leader>ue Explain this selected code:`
2.  **Current Buffer:**
    - In Chat: `Explain the purpose of the current file: #buffer`
3.  **Specific File (via `/file` Slash Command):**
    - In Chat: `/file path/to/some/other/file.ts`
    - Then: `Can you summarize the main functionality of the file I just shared?`

**D. Understanding LSP Diagnostics**

1.  **Visual Selection with LSP Errors:**
    - Visually select code that has LSP diagnostics (errors/warnings).
    - Run `:CodeCompanion /lsp` (uses a pre-defined prompt).
2.  **Current Buffer with LSP Errors:**
    - In Chat: `Help me understand these LSP issues: #lsp #buffer`
    - You can then paste specific error messages for more clarity.

### III. Writing & Modifying Code (The "Agentic" Workflow)

**A. Interactive Editing with `@editor` and Buffer Watching/Pinning**

This is powerful for iterative development with the LLM.

1.  **Make Buffer Contextual:**

    - Open the file you want the LLM to edit (e.g., `deenji/src/server/services/elasticsearch.service.ts`).
    - In CodeCompanion Chat, make it known to the LLM:
      - `Working on `elasticsearch.service.ts`. Context: #buffer{watch}`
        - `{watch}`: Sends diffs of your changes on subsequent prompts. Good for ongoing edits.
      - Or: `Context for `elasticsearch.service.ts`: #buffer{pin}`
        - `{pin}`: Sends the full buffer content on every prompt. Simpler for LLM if file is changing a lot or for initial generation.

2.  **Instruct the LLM to Edit:**

    - "Please add a new method `deleteProperty(id: string)` to `#buffer{watch}` that calls `this.esClient.delete(...)`."
    - "Refactor the `buildPropertyQuery` function in `#buffer{watch}` for better readability."
    - "In `#buffer{pin}`, based on the requirements we discussed, implement the initial structure for the `PropertyFilters` interface."

3.  **LLM Proposes Changes via `@editor` Tool:**

    - LLM's response will indicate it's using the `@editor` tool.
    - CodeCompanion will attempt to apply these changes directly to your watched/pinned buffer.

4.  **Review Diff & Accept/Reject:**

    - A diff view of the modified file should appear.
    - **`ga` (normal mode in diff): Accept** the LLM's changes.
    - **`gr` (normal mode in diff): Reject** the LLM's changes.

5.  **Iterate:**
    - If you accept, the watched buffer is updated.
    - If you make manual changes after the LLM's edit (or after rejecting), the `#buffer{watch}` will send these diffs on your next prompt, keeping the LLM in sync.
    - _Example follow-up:_ "Thanks. Now, in `deleteProperty` within `#buffer{watch}`, add error handling."

**B. Generating New Code (Inline Assistant)**

1.  **Cursor Position:** Place your cursor where you want new code.
2.  **Invoke Inline Assistant:**
    - `:CodeCompanion <Your prompt for new code>`
    - _Example:_ `:CodeCompanion Generate a TypeScript interface `PropertyImage` with fields: id (string), url (string), isFeatured (boolean).`
3.  **Review Diff & Accept/Reject:**
    - A diff view of the current buffer with the new code inserted will appear.
    - `ga` to accept, `gr` to reject.

**C. Fixing Errors**

1.  **Targeted Fix (Recommended):**
    - In Chat, with file context loaded (`#buffer{watch/pin}`):
      `Error in `#buffer{watch}`:\nMessage: "<PASTE_ERROR>"\nLine: <LINE_NO>\nSnippet:\n\`\`\`typescript\n<CODE_SNIPPET>\n\`\`\`\nPlease explain and suggest a fix.`
    - Then use `@editor` to apply the fix if suggested clearly.
2.  **Broader Fix with LSP Context:**
    - In Chat: `This file `#buffer{watch}` has several TS errors. Here are the diagnostics: #lsp. Can you help resolve them?`
    - Provide specific error messages from your LSP if needed.

### IV. Other Useful CodeCompanion Features

**A. Slash Commands (in Chat Buffer)**

- `/file <path>`: Adds content of a local file to chat.
- `/buffer`: Pick from open buffers to add their content.
- `/fetch <URL>`: Fetches content from a URL.
- `/symbols <path_or_pick>`: Adds a symbol outline of a file (token-efficient).
- `/terminal`: Adds output from the last terminal buffer.
- `/help <vim_help_tag>`: Adds Vim help content.
- `/now`: Inserts current date/time.

**B. Variables (in Chat Buffer)**

- `#buffer`: Content of the last active non-CodeCompanion buffer. (Can use `#buffer{watch}` or `#buffer{pin}`).
- `#lsp`: LSP diagnostics for `#buffer`.
- `#viewport`: Code visible in your Neovim viewport.
- Custom variables (if defined in your config).

**C. Action Palette (`:CodeCompanionActions` or `<leader>cca`)**

- Access pre-defined prompts (e.g., `/explain`, `/tests`, `/commit`).
- Switch between open chat buffers.
- Run custom workflows.
- Generate new `codecompanion-workspace.json` groups.

**D. Generating Commit Messages**

1.  Stage your changes in git.
2.  Run `:CodeCompanion /commit` (from Action Palette or command line).
3.  The LLM will generate a commit message based on your staged diff.

**E. Creating Neovim Commands (`:CodeCompanionCmd`)**

- `:CodeCompanionCmd <Your prompt describing the command>`
- _Example:_ `:CodeCompanionCmd Create a command that opens a floating terminal and runs 'git status'.`
- The LLM generates the Vimscript/Lua for the command in your command-line area.

### V. Workflow Example: Implementing a New Feature

1.  **Understand Requirements:**
    - Load relevant part of `codecompanion-workspace.json`: `/workspace "New Feature Spec"`
    - Chat with LLM to clarify requirements based on this context.
2.  **Explore Existing Code (if needed):**
    - `@vectorcode find existing services related to X`
    - `@vectorcode show me examples of Y pattern in this project`
3.  **Create/Open Files:**
    - Manually create new files (e.g., `new-feature.service.ts`).
    - Open existing files to be modified.
4.  **Iterative Implementation with `@editor` and `#buffer{watch/pin}`:**
    - Make the target file active context: `Working on `new-feature.service.ts`: #buffer{pin}`
    - Prompt LLM: "Based on the requirements, create the initial class structure for `NewFeatureService` in `#buffer{pin}`."
    - LLM uses `@editor`. Review diff, `ga` to accept.
    - Prompt: "Now add a method `processData(data: InputType): OutputType` to the class in `#buffer{watch}`. It should..."
    - Continue this loop: prompt, LLM edits, review, accept, refine.
5.  **Write Tests (TDD or after):**
    - Open spec file. Make it active context: `Writing tests for `NewFeatureService`in`new-feature.service.spec.ts`: #buffer{watch}`.
    - Provide context of the implementation: `/file path/to/new-feature.service.ts`
    - Prompt: "Generate Vitest unit tests for the `processData` method in `NewFeatureService`."
6.  **Fix Bugs:** Use targeted error fixing or `#lsp` as described above.
7.  **Generate Commit Message:** `:CodeCompanion /commit`
