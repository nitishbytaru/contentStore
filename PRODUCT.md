# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Solo creators: independent writers and YouTubers/Instagram creators who research, write and film their content alone. They work mostly on desktop in long writing and research sessions, and use their phone for quick capture, checking progress and reading scripts.

## Product Purpose
ContentStore is a personal content operating system. It takes one content idea from first thought through research, a published article and a video script, ending at a teleprompter for recording. Success means a creator can carry an idea all the way to a finished article and script without switching tools, and without losing or repeating ideas.

## Positioning
- **Grounded in your sources:** the research assistant answers only from the PDFs and notes the creator uploads for that idea (RAG over Qdrant), not from the open web.
- **One idea, full pipeline:** idea → research → article → video script → teleprompter, all on one idea page.
- **No duplicate ideas:** a semantic scan of a new title surfaces the 3 closest existing ideas before saving.
- **Chat from Telegram:** a ContentStore Telegram bot answers questions about the creator's own ideas and pipeline.

## Operating Context
- Routes: `/` (home), `/ideas`, `/ideas/new`, `/ideas/[ideaId]` (research chat, article, script tabs), `/prompts` (prompt template library), `/analytics`, `/profile`, `/login`, `/signup`.
- Today an unauthenticated visitor lands straight on `/login`. There is no public landing page yet.
- Telegram bot via `/api/telegram/webhook` (see TELEGRAM_INTEGRATION_PLAN.md).
- Publishing targets tracked in analytics: Medium, Substack, YouTube, Instagram.

## Capabilities and Constraints
- Stack: Next.js 16 App Router, React 19, TypeScript only, Tailwind v4, shadcn/ui only (see rules.md), Redux Toolkit / RTK Query, Supabase (auth + Postgres with RLS), Qdrant, local MiniLM embeddings, Groq LLMs, unpdf, deployed on Vercel.
- Features: semantic idea scan, per-idea RAG research chat (PDF upload or pasted text), Generate Article from the research transcript, rewrite with prompt templates, Enhance Prompt with AI, script editor, full-screen teleprompter (auto-scroll speed, font size, eye line, mirror mode, rehearsal timer), prompt library, analytics, onboarding tour.
- Forced dark mode. The UI must stay compact and data-rich, and work on mobile as well as desktop.

## Brand Commitments
- Name: ContentStore.
- Binding palette (user-specified, see DESIGN.md): pure black #000000 and faded black #141414 surfaces only (no other greys), neon green #2cff05 (main click target only) and electric purple #bf00ff (highlights only) 10%.

## Evidence on Hand
- `../launch video/` holds screenshots and screen recordings of the real app flow.
- No testimonials, user counts, pricing or press exist. Do not fabricate them.

## Product Principles
1. One idea is the unit of work. Everything hangs off the idea page.
2. Trust comes from the creator's own sources, never invented facts.
3. Protect the creator's attention: catch duplicate ideas early and keep the next step obvious.
4. Desktop is for deep work and the phone is for quick touchpoints. Both must work.
