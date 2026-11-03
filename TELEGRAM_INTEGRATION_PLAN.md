# Telegram Bot Integration Plan ("ContentStore" bot)

Status: **Planned, not started** (saved 2026-11-03)

## Goal

Let a user query their ContentStore data from a chat app. The user messages a contact called **ContentStore**, e.g.
"how many ideas are still pending in my list", an LLM understands the request, calls tools that read the
user's ideas from the database, and replies in the chat.

## Platform decision: WhatsApp vs Telegram

**WhatsApp (official Meta WhatsApp Cloud API)**
- Free to set up (Meta-hosted, no Twilio needed); free test number for development.
- User-initiated chats open a 24h service window; free-form replies inside it are free → Q&A use case is effectively free.
- Paid: business-initiated messages outside the 24h window (e.g. daily "you have 5 pending ideas" reminders) need approved templates, charged per message (varies by country).
- Friction: Meta Business account, a phone number not already on WhatsApp, test number limited to ~5 recipients, business verification to scale.
- Avoid unofficial libs (whatsapp-web.js / Baileys): against ToS, ban risk, need a long-running process (no serverless).

**Telegram (chosen)**
- Bot API completely free, no messaging windows, bot can message users proactively anytime.
- Setup in ~2 minutes via `@BotFather`, no business verification, no phone number required.
- Downside: users must have Telegram installed.

**Decision:** Go with **Telegram**, same functionality. Keep the agent/tools layer channel-agnostic so WhatsApp can be added later.

## Architecture

```
Telegram user ──msg──▶ Telegram ──webhook POST──▶ /api/telegram/webhook
                                                      │ 1. verify X-Telegram-Bot-Api-Secret-Token header
                                                      │ 2. chat_id → user_id (telegram_links table)
                                                      │ 3. Groq agent loop with tools
                                                      │      └─ tools query `ideas` WHERE user_id = <linked user>
                                                      └─▶ sendMessage reply back to the chat
```

Existing stack this builds on: Next.js 16 route handlers, Supabase (with RLS), Groq OpenAI-compatible
chat completions (`GROQ_API_KEY`, `GROQ_MODEL`), deployed serverless (Vercel).

## Key problems & solutions

### 1. Identifying the user (account linking)
A Telegram message only carries a `chat_id`, not a Supabase session.

- Web app shows a **"Connect Telegram"** button (logged-in user).
- Clicking it generates a one-time `link_code` (expires in ~10 min) and opens
  `https://t.me/<TELEGRAM_BOT_USERNAME>?start=<code>`.
- User taps **Start** → bot receives `/start <code>` → server validates code, stores `chat_id ↔ user_id`.
- Unlinked chats get a reply telling them to connect from the web app.

New table:

```sql
CREATE TABLE IF NOT EXISTS public.telegram_links (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id BIGINT UNIQUE,
    link_code TEXT UNIQUE,
    code_expires_at TIMESTAMPTZ,
    linked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own telegram link"
    ON public.telegram_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own telegram link"
    ON public.telegram_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own telegram link"
    ON public.telegram_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own telegram link"
    ON public.telegram_links FOR DELETE USING (auth.uid() = user_id);
```

### 2. Database access without cookies
The webhook has no logged-in session, so RLS blocks normal queries.

- Use a **service-role Supabase client** (`SUPABASE_SERVICE_ROLE_KEY`) in the webhook only, server-side only.
- Service role bypasses RLS, so **every tool must filter by the linked `user_id` in code**.
  The LLM never supplies or chooses the user id.

## Files to create / change

| File | Purpose |
|---|---|
| `supabase/schema.sql` | add `telegram_links` table + RLS (above) |
| `src/lib/supabase/admin.ts` | service-role client (server-only) |
| `src/lib/telegram/api.ts` | `sendMessage`, `sendChatAction` ("typing…") helpers |
| `src/lib/telegram/tools.ts` | tool JSON schemas + executors |
| `src/lib/telegram/agent.ts` | Groq tool-calling loop (max ~4 rounds) |
| `src/app/api/telegram/webhook/route.ts` | receive updates; handle `/start <code>`, `/help`, `/unlink`; run agent |
| `src/app/api/telegram/link/route.ts` | logged-in user: create link code (POST), status (GET), unlink (DELETE) |
| `src/components/TelegramConnect.tsx` | "Connect Telegram" button, placed in `NavLinks` |

## Agent tools (v1 = read-only)

Reuse `matchesIdeaFilters` and `getIdeaPublishStatus` from `src/utils/ideaStatus.ts` so "pending" means
exactly what it means in the UI (pending = not completed; completed = status `posted`).

- `count_ideas(status: pending|completed, type: all|research|article|video)`
  → "how many ideas are still pending?"
- `list_ideas(status, type, limit)` → titles, stage label, created date
- `search_ideas(query)` → keyword match on title/description
- `get_idea_details(idea_id)` → description, stage, whether article / script / research exist

Possible v2 write tools: `create_idea`, `mark_idea_posted`. Optional later: short chat memory
(last few messages per chat), daily pending-ideas reminder (free on Telegram).

## Setup checklist

1. Telegram: message `@BotFather` → `/newbot` → name it **ContentStore** → copy the bot token.
2. Env vars (`.env.local` and Vercel):
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME` (without `@`)
   - `TELEGRAM_WEBHOOK_SECRET` (any random string)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard → Settings → API)
3. Run the new SQL in the Supabase SQL editor.
4. Register the webhook once:
   ```bash
   curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
     -d "url=https://<your-domain>/api/telegram/webhook" \
     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```
   For local testing, expose `next dev` with ngrok and point the webhook at the ngrok URL.

## Notes / gotchas

- `GROQ_MODEL` must support tool calling (`openai/gpt-oss-120b` or `llama-3.3-70b-versatile` work).
- Webhook should always return 200 (catch errors and reply with a friendly message in chat),
  otherwise Telegram retries and the user gets duplicate replies. Optionally dedupe on `update_id`.
- Telegram message limit is 4096 chars; truncate/split long lists.
- `src/proxy.ts` runs on `/api/*` but does not redirect API routes, so the webhook is reachable unauthenticated
  (secured by the secret header instead).
- Read `node_modules/next/dist/docs/` for route handler conventions before writing code (Next 16 has breaking changes).
