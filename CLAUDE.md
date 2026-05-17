# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"纸片人男友" (Paper Boyfriend) - AI virtual dating chat app with 4 AI boyfriend characters. Next.js 16 App Router + React 19 + shadcn/ui + TypeScript.

## Commands

```bash
pnpm dev       # Development (port 5000)
pnpm build     # Production build
pnpm start     # Production server
pnpm validate  # lint + ts-check (parallel)
```

MUST use `pnpm` only (enforced via preinstall hook).

## Architecture

### Custom Server
`src/server.ts` - custom Node.js server. Dev uses `tsx watch`, prod builds to `dist/server.js` via `tsup`.

### Service Providers (`src/services/`)
- **LLM** (`llm/siliconflow.ts`): SiliconFlow API, GLM-4.7 model
- **Image** (`image/volcano.ts`): Volcano API, doubao-seedream model
- **Storage** (`storage/`): Factory pattern, AWS S3 / Aliyun OSS, supports load balancing via `STORAGE_MODE` env

### State (`src/context/ChatContext.tsx`)
Manages character selection, messages, typing/image-gen states. Orchestrates parallel TTS + image generation after LLM response.

### Characters (`src/data/characters.ts`)
4 boyfriend characters with system prompts, appearance descriptions (for image consistency), TTS speaker IDs.

### API Routes
- `/api/chat` - LLM completion
- `/api/tts` - Text-to-speech
- `/api/image` - Image gen (auto-enhanced with character appearance)

## Key Patterns

**Image Generation**: LLM uses `[IMAGE: description]` marker → `parseReply()` extracts → prompt enhanced with character appearance.

**Path Alias**: `@/` → `src/`

**Client Components**: `'use client'` for hooks/browser APIs. Root layout uses `react-dev-inspector` in dev.

## Constraints

**ESLint**:
- No `<head>` tags → use `metadata` API
- No absolute paths in `next.config.ts` → use `path.resolve(__dirname, ...)` or `process.cwd()`

**Hydration**: No `typeof window`, `Date.now()`, `Math.random()` in JSX render. Use `'use client'` + `useEffect` + `useState`.

**UI**: shadcn/ui components in `src/components/ui/`. Prefer these over custom primitives.

**External Resources**: CSS/fonts via `@import` in `globals.css` or `next/font`. preload via ReactDOM methods.

## Project-Specific Behavior Guidelines

Applying global CLAUDE.md principles to this project:

**Simplicity**: The service layer uses factory pattern for storage - this abstraction IS justified because it supports multiple providers (AWS S3, Aliyun OSS) with load balancing. Don't add new abstractions unless similarly justified.

**Surgical Changes**: Character prompts in `characters.ts` are carefully tuned. When editing, preserve the personality traits and speech styles - only modify what the user explicitly requests.

**Goal-Driven**: For changes to chat/image generation flow, verify by:
1. Run `pnpm dev`
2. Test the specific character and scenario affected
3. Check browser console for errors