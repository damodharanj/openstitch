# Project: OpenStitch

The open source alternative to Google Stitch.
**Mission**: Create UI mockups like Figma using AI, powered by HTML+Tailwind

## 🧠 Brain & Context
- **Current Checklist**: `[Checklist](task.md)` (Use this to track progress)
- **Primary Tech Stack**: React, Vite, Tailwind CSS, Express, AI SDK, TypeScript, MongoDB
- **Dev flow**: Always write the **TypeBox** schema for each feature in the `schema` folder and then proceed to develop the feature. Make sure the same schema is reused in both server and client.

## 🏗 Architecture

The project follows a standard Single Page Application (SPA) architecture combined with a backend API:

-   **Frontend**: React application built with Vite. Styling is handled exclusively with Tailwind CSS.
-   **Backend**: Express.js server providing RESTful APIs.
-   **Database**: MongoDB for data persistence.
-   **Communication**: The frontend communicates with the backend via HTTP requests. Types are shared between client and server to ensure type safety using TypeScript.

### Data & Type Safety
-   **Single Source of Truth**: All data models are defined using **TypeBox** in the `schema` folder.
-   **Full Stack Type Safety**:
    -   **Runtime**: TypeBox acts as the runtime validator (compatible with JSON Schema).
    -   **Static**: TypeScript types are inferred directly using `Static<typeof Schema>`.
-   **Strict Synchronization**: Shared TypeBox definitions ensure the frontend and backend speak the exact same language.

### Canvas & Rendering
-   **Canvas Engine**: Use **ReactFlow** for the infinite canvas implementation.
-   **Node Rendering**: Distinct design components MUST be rendered inside an **iframe** within the ReactFlow nodes.
    -   **Purpose**: To ensure complete CSS isolation and accurate "browser" rendering for each mockup.
    -   **Implementation**: Pass the generated HTML/Tailwind string into the iframe context.

## 🤖 Agent Protocols

### 1. Planning First
Always create or update the checklist in `task.md` before starting major features.
Update `AGENTS.md` if the architecture changes significantly.

### 2. Design Reference
- **Visual Source of Truth**: Check the `screenshots-reference` folder for visual guidance. These images are the source of truth for the desired look and feel.

### 3. Code Style
- **Styling**: **Tailwind CSS ONLY**. No distinct CSS files for components unless absolutely necessary (e.g., animations not in Tailwind).
- **Types**: Strict TypeScript. Define interfaces for all props and data structures.
-   **Figma Compatibility**: Ensure all generated HTML is semantic and "renderable" by Figma import plugins (avoid complex hacks).

### 5. Schema-First Development
-   **Must Do**: Define the **TypeBox** schema before writing any code.
-   **Validation**: Ensure end-to-end type safety by using inferred types (`Static<T>`) and runtime validation.
-   **No Magic Strings**: Avoid `any` or loose typing. If it's not in the schema, it doesn't exist.
-   **Strict Coupling**: The code must strictly adhere to the schema.
    -   **Single Source of Truth**: Both Frontend and Backend must rely on the schema definition.
    -   **Break on Change**: Code should be written such that if the schema changes (e.g., removing a field or enum option), the code fails to compile (TypeScript error).
    -   **No Hardcoded Config**: UI options and logic must be derived from the schema where possible, or strictly typed against it to ensure synchronization.

### 6. Verification


-   **Automated Verification**:
    -   Run `npm run lint` to ensure code style consistency.
    -   Run `npm run test` to execute unit and integration tests.
-   **Manual Verification**:
    -   Visually compare implemented components against the source images in the `screenshots-reference` folder.
    -   Verify "Chat to Edit" functionality by simulating user interactions.

### 7. AI Generation
-   **SDK**: Use **Vercel AI SDK** (`ai` package) for all LLM interactions.
-   **Model**: Use Request/Response model (e.g., `generateObject` or `generateText`) for node generation.
-   **Response Processing**:
    -   **HTML Extraction**: Automatically parse the AI response for markdown code blocks containing HTML (```html).
    -   **Node Creation**: For each extracted HTML block, create a new node in the `InfiniteCanvas`.
    -   **Rendering**: Render the node using a custom ReactFlow node type that wraps the HTML in an **iframe**.
    -   **Persistence**: Automatically save the new node to the project's state in the backend.
-   **Context**: **Full Conversation History** MUST be passed to the LLM to support "Copilot" functionality (refining edits, understanding context). Do not send just the last message.
-   **Configuration**: User's **LLM Configuration** (active provider + keys) must be retrieved from their profile. Support OpenAI, Anthropic, Gemini, Ollama, and OpenRouter.
-   **Target Schema**: When generating nodes, always strictly adhere to the `StitchComponent` schema (HTML content with Tailwind classes).
-   **Prompting**: Ensure prompts explicitly request "HTML with Tailwind CSS classes" and "no external CSS".


## 8. Authentication
-   **Provider**: Use **Clerk** for complete authentication management (switched from custom auth).
-   **Flow**:
    -   **Frontend**: Use `@clerk/clerk-react` components (`<SignIn />`, `<UserButton />`) for UI.
    -   **Backend**: Use `ClerkExpressRequireAuth` middleware to secure API routes.
    -   **Tokens**: All protected API requests MUST include the Clerk session token in the `Authorization` header.
-   **Data Sync**:
    -   Clerk is the source of truth for Identity (ID, Email, Image).
    -   Our MongoDB `User` collection is for application-specific data (LLM config, projects).
    -   **Strict Rule**: Do not duplicate identity fields (password, hash) in our DB.

## 🛠 Workflows

### Setup & Development
1.  **Installation**: Run `npm install` in the root directory to install dependencies for both client and server (assuming a monorepo structure or root-level script management).
2.  **Start Dev Server**: Run `npm run dev` to start both the frontend and backend development servers concurrently.

### Build & Deploy
-   **Build**: Run `npm run build` to generate production-ready assets for the frontend and compile the backend.

### Quality Checks
-   **Linting**: Run `npm run lint` before committing changes to catch style issues.
-   **Testing**: Run `npm run test` to ensure no regressions were introduced.
## 📝 Roadmap
Refer to `task.md` for the active itemized roadmap.
High-level goals:
1.  Robust Component Generation (Tailwind accuracy).
2.  Seamless "Chat to Edit" experience.
3.  Perfect Figma Export.
