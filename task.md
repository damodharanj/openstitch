# OpenStitch Development Tasks

## Schema Definitions (TypeBox)
- [x] Create `schema` directory
- [x] Define **User Schema** (`schema/user.ts`)
    - [x] User identity (id, email, name, createdAt)
    - [x] Auth related fields (if needed)
- [x] Define **Project Schema** (`schema/project.ts`)
    - [x] `Project` metadata (id, ownerId, title, isPublic, timestamps)
    - [x] `ProjectState` (canvas viewport, list of nodes, list of edges)
- [x] Define **Component/Node Schema** (`schema/node.ts`)
    - [x] `NodeData` structure for ReactFlow nodes
    - [x] `StitchComponent` definition (containing HTML string, Tailwind classes)
    - [x] Dimensions and constraints
- [x] Define **Chat & AI Schema** (`schema/chat.ts`)
    - [x] `PromptRequest` (user input, context)
    - [x] `GenerationResponse` (generated code, reasoning)
    - [x] `ChatHistory` (list of messages)
- [x] Create centralized export (`schema/index.ts`)

## Verification
- [x] Set up **Vitest** for unit testing
- [x] Write schema unit tests (`schema/schema.test.ts`)

## Backend API Implementation
- [x] Setup Express Server (`server/index.ts`)
- [x] Implement Project Routes (`server/routes/projects.ts`)
    - [x] GET /projects
    - [x] GET /projects/:id
    - [x] POST /projects
    - [x] PUT /projects/:id
- [x] Implement Chat Routes (`server/routes/chat.ts`)
    - [x] POST /chat/message
    - [x] GET /chat/:projectId produces history
- [ ] Implement Node/Component Routes (`server/routes/nodes.ts`) (if not embedded in project)

## Frontend Implementation
- [x] Initialize Vite + React + TypeScript in `client` directory
- [x] Configure Tailwind CSS
- [x] Setup Proxy to Backend
- [x] Implement Main Layout (Sidebar, Canvas, Chat)

## Authentication Implementation
- [ ] Install Clerk SDKs (Client & Server)
- [ ] Configure Environment Variables (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- [ ] Implement Auth Wrappers (`ClerkProvider`, `SignedIn/SignedOut`)
- [x] Create/Update `schema/user.ts` to map Clerk User ID
- [ ] Secure Backend Routes with Middleware
- [ ] Update API Client to inject Tokens


