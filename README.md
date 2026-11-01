# ContentStore

ContentStore is a personal content operating system. It tracks an idea from a title, through research, an article draft, and a video script, until the piece is published. Google Sheets is the record of ideas and prompts. A local Qdrant index is used only to find similar ideas before a new one is created.

The planned AI architecture in [AI_INTEGRATION_README.md](./AI_INTEGRATION_README.md) is not what the app runs today. The live AI feature is **Scan through ideas**.

## Run it

1. Copy `.env.example` to `.env.local` and fill in the Google service account, sheet id, and app password.
2. Share the Google Sheet with the service account email.
3. Start Qdrant, then the app:

```bash
docker compose up -d
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with `APP_PASSWORD`.

`docker compose up -d` starts only Qdrant (`qdrant/qdrant`) on ports `6333` and `6334`. Vectors live in the `qdrant_storage` volume. The Next.js app stays on `npm run dev`.

| Variable | Purpose |
| :--- | :--- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account that can read and write the sheet |
| `GOOGLE_PRIVATE_KEY` | Service account private key. Keep the `\n` line breaks. |
| `GOOGLE_SHEET_ID` | Id from the sheet URL |
| `APP_PASSWORD` | Password for the login page. `ADMIN_PASSWORD` is accepted as a fallback. |
| `AUTH_SECRET` | HMAC secret for the session cookie |
| `QDRANT_URL` | Qdrant HTTP endpoint. Default `http://localhost:6333` |

## Sign in

Every page except `/login` and `/api/auth` requires a session cookie (`cs_auth_session`). The password is checked on the server. A normal session lasts 30 days. Remember me lasts 90 days. Sign out clears the cookie.

## Analytics (`/`)

The home page reads every idea and summarizes the pipeline:

- How many ideas exist, how many have research, and how many are in the article or video tracks
- A conversion funnel from the idea pool through research, a chosen format, and a published piece
- Article and video stage counts, and how long those stages took when timestamps were recorded

Nothing on this page writes data.

## Ideas (`/ideas`)

The ideas list is the first worksheet in the Google Sheet. Each row is one idea: title, research (`baseArticle`), article draft (`mediumArticle`), video script (`youtubeScript`), platform flags, and stage timestamps.

The list can be searched and filtered by type (all, research, article, video) and by pending or completed. A card can be renamed, copied, or deleted. Deleting a row also removes its vector from Qdrant.

A mobile timer on this page is a local rehearsal clock. It does not change the sheet.

New ideas are created eligible for Medium, Substack, YouTube, and Instagram, with status `pending`. An idea is completed when its required article and video stages are published and you mark it complete. Completed ideas use status `posted` or `completed`.

### Create an idea (`/ideas/new`)

The form asks for the article title only.

**Scan through ideas** embeds that title and searches Qdrant for the three closest existing ideas.

- **Continue with this idea** opens that idea. Nothing new is saved.
- **Continue with new idea** writes the title to the sheet, embeds it, and opens the new editor.
- If the sheet has no ideas yet, the scan stops immediately and says this is the first idea. Nothing is embedded or searched. You can still create it.

The first scan embeds any sheet rows that are not in Qdrant yet. Embeddings are computed in the Next.js server with `Xenova/all-MiniLM-L6-v2` (384 dimensions, cosine). There is no embedding API key. The model is cached under `.cache/transformers` on first use. A Qdrant or embedding failure shows a toast and does not create an idea.

Creating, renaming, or editing research updates the vector. If Qdrant is down, the sheet write still succeeds and the next scan fills the gap.

### Idea editor (`/ideas/[ideaId]`)

One idea has three working areas:

- **Research.** A chat for one idea. Paste notes or upload a PDF. The text is chunked into the Qdrant `research` collection, and the thread is stored on the `ResearchMessages` sheet. Questions go to Groq with those chunks. The latest reply is also saved in `baseArticle`, which is what marks the idea as researched. Set `GROQ_API_KEY` in `.env.local`.
- **Article.** The Medium and Substack draft in `mediumArticle`, with drafted and published checkpoints and timestamps.
- **Video script.** The script in `youtubeScript`. Shooting, editing, and uploaded are separate checkpoints with timestamps.

**Configure Formats** turns the article tabs and the video tab on or off. The article track follows Medium and Substack. The video track follows YouTube and Instagram. **Save** writes the open idea back to the sheet. **Complete Idea** closes it once every enabled track is published.

The video script can open a full-screen teleprompter. It scrolls the script, and you can change speed, font size, mirroring, and an eye line. The prompter does not record audio and does not write to the sheet.

## Prompts (`/prompts`)

Prompts are reusable writing instructions, stored on the `Prompts` worksheet (`id`, `title`, `content`, `category`, timestamps). Categories live on the `PromptCategories` worksheet. Both sheets are created on first use if they are missing.

You can search, filter by category, create a category, and add, edit, copy, or delete a prompt.

## Where data lives

| Data | Store |
| :--- | :--- |
| Ideas, research, drafts, scripts, stage flags | First worksheet of the Google Sheet |
| Prompts | `Prompts` worksheet |
| Prompt categories | `PromptCategories` worksheet |
| Similar-idea vectors | Qdrant collection `ideas` |

The sheet is the source of truth. Qdrant only answers "what existing ideas are closest to this title?"
