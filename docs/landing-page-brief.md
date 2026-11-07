# Landing Page Brief (`/`)

Status: built (2026-11-07). Waiting on real screenshots in public/landing/
Sources: `../launch video/` footage, narration script (`output/audio/narration/script.txt`), PRODUCT.md, DESIGN.md.

## 1. Job and audience
- **Who:** solo creators (writers, YouTubers, Instagram creators) arriving cold, often from a link. Mostly desktop, sometimes on a phone.
- **Today:** `/` redirects to `/ideas`, and middleware sends logged-out visitors to `/login` with no explanation of the product.
- **Mode:** Persuade. The visitor should understand how to use ContentStore before signing up.

## 2. Outcome
- **Primary action:** one neon green **Get started free** button that goes to `/signup` (repeated once at the bottom). **Log in** is a secondary ghost button in the header.
- **Success:** a visitor can say "I add an idea, give it my sources, get an article and a script, then read it on the prompter, and I can do it from Telegram too" before clicking sign up.
- **Signed-in visitors** who hit `/` go straight to `/ideas` (current behavior kept for them).

## 3. Page sequence
1. **Header:** ContentStore wordmark, Log in (ghost), Get started (neon green).
2. **Hero:** one-line promise ("From idea to article to script, grounded in your own sources"), a short subline, the primary CTA, and one large recaptured screenshot of an idea page.
3. **How it works:** 4 numbered steps, each with a screenshot and 1–2 lines taken from the narration:
   1. **Add an idea, skip the duplicates.** Scan through ideas shows your 3 closest existing ideas. Continue one or start new.
   2. **Research from your own sources.** Upload a PDF or paste notes, then ask questions. Answers come from your document, not the internet.
   3. **Generate the article.** One click turns your research chat into a draft you can edit.
   4. **Script and teleprompter.** Paste your script and record with the full-screen prompter: speed, text size, mirror mode for a rig.
4. **Telegram bot:** "Your ContentStore in your chat." Ask how many ideas you have, list them, or create one. The bot replies with a link, and the idea is already on the site.
5. **Closing CTA:** short restatement plus **Get started free**.
6. **Footer:** minimal (name, Log in).

## 4. Assets needed (user to recapture in the new palette)
Desktop screenshots at 1440×900 (or similar 16:10), black / faded-black palette, real data with no personal info visible:
| # | Shot | Shows |
|---|---|---|
| 1 | Hero | Idea page with the Research tab open and a PDF source plus an answered question |
| 2 | Step 1 | Create New Idea dialog with the **Similar Ideas** list (3 results) visible |
| 3 | Step 2 | Research chat: source chip + "Reading the source" or an answered question |
| 4 | Step 3 | Article tab with a generated draft |
| 5 | Step 4 | Prompter running (mirror mode is a nice second shot) |
| 6 | Telegram | Telegram chat: "how many ideas", the list, and the created idea with link |
Optional: 2–4 short (5–8s) muted MP4/WebM loops for steps 1, 2 and 4. Put files in `public/landing/`.
Until real shots exist, the page uses labelled placeholders of the right size, never fake UI.

## 5. Layout and behavior
- Steps alternate image left/right on desktop and stack (text, then image) on mobile. Keep it compact per rules.md.
- Neon green appears only on the Get started buttons; step labels use the purple highlight. Everything else is pure black and faded black.
- Images: `next/image`, lazy below the fold, rounded with a faint white-overlay border, and descriptive alt text.
- No pricing, testimonials, user counts or claims that don't exist (PRODUCT.md: Evidence on Hand).

## 6. Technical scope
- `src/app/page.tsx` becomes the public landing page (server component). Signed-in visitors get redirected to `/ideas`.
- Middleware (or Next 16 `proxy.ts`) must allow `/` for logged-out visitors.
- New components live in `src/components/landing/`, built with shadcn `Button`/`Card` and TypeScript only.

## 7. Open decisions
- Final hero headline wording (draft above).
- Whether to also link the full launch video once it's re-cut in the new palette.
