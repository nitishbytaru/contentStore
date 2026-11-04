import { after } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createUserIdea, fetchUserIdeaById, fetchUserIdeas } from '@/lib/supabase/ideas';
import { upsertIdeaVector } from '@/lib/idea-index';
import {
  getIdeaPublishStatus,
  hasIdeaResearch,
  isArticleIdea,
  isIdeaCompleted,
  isVideoIdea,
  matchesIdeaFilters,
} from '@/utils/ideaStatus';
import { Idea, IdeaStatusFilter, IdeaTypeFilter } from '@/types';

const STATUSES = ['pending', 'completed', 'any'] as const;
const TYPES = ['all', 'research', 'article', 'video'] as const;
const STAGES = ['pending', 'article', 'video', 'article_and_video'] as const;

type StatusArg = (typeof STATUSES)[number];
type TypeArg = (typeof TYPES)[number];

/** Long text fields are capped so one idea can't blow the model's context; the link has the full text. */
const MAX_FIELD_CHARS = 12000;

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return 'https://store24.vercel.app';
}

const ideaUrl = (ideaId: string) => `${siteUrl()}/ideas/${ideaId}`;

const statusParam = {
  type: 'string',
  enum: STATUSES,
  description: "'pending' = not completed yet, 'completed' = posted/done, 'any' = both. Defaults to 'any'.",
};
const typeParam = {
  type: 'string',
  enum: TYPES,
  description:
    "'all' = every idea, 'research' = needs research, 'article' = article ideas, 'video' = video ideas. Defaults to 'all'.",
};

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'count_ideas',
      description: "Count the user's content ideas, optionally filtered by status and type.",
      parameters: {
        type: 'object',
        properties: { status: statusParam, type: typeParam },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_ideas',
      description:
        "List the user's content ideas (newest first) with id, title, status, stage, formats, platforms, dates, what content exists, and the website link.",
      parameters: {
        type: 'object',
        properties: {
          status: statusParam,
          type: typeParam,
          limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Max ideas to return. Defaults to 25.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_ideas',
      description:
        "Keyword search over the user's idea titles, descriptions, research notes, articles and scripts. Use it to find an idea the user refers to by name.",
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Keywords to look for.' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_idea_details',
      description:
        'Get everything about one idea: title, description, status, stage, formats, platforms, dates, research notes, article draft, video script and website link.',
      parameters: {
        type: 'object',
        properties: { idea_id: { type: 'string', description: 'The idea id from list_ideas or search_ideas.' } },
        required: ['idea_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_prompts',
      description: "List the user's saved prompts (title and content).",
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Optional keyword filter on title/content.' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_idea',
      description:
        'Create a NEW content idea for the user. Only call this when the user clearly asks to add/create/save an idea. Cannot modify existing ideas.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short idea title.' },
          description: { type: 'string', description: 'Optional longer description of the idea.' },
          research_notes: { type: 'string', description: 'Optional research notes / outline for the idea.' },
          stage: {
            type: 'string',
            enum: STAGES,
            description:
              "Starting stage. 'pending' = no format chosen yet, 'article' = article only (Medium/Substack), 'video' = video only (YouTube/Instagram), 'article_and_video' = both. Defaults to 'article_and_video' like the website.",
          },
          completed: { type: 'boolean', description: 'Create it already marked as completed/posted. Defaults to false.' },
        },
        required: ['title'],
      },
    },
  },
];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function filterIdeas(ideas: Idea[], status: StatusArg, type: TypeArg): Idea[] {
  const t = type as IdeaTypeFilter;
  if (status === 'any') {
    return ideas.filter(
      (idea) =>
        matchesIdeaFilters(idea, t, 'pending' as IdeaStatusFilter) ||
        matchesIdeaFilters(idea, t, 'completed' as IdeaStatusFilter)
    );
  }
  return ideas.filter((idea) => matchesIdeaFilters(idea, t, status as IdeaStatusFilter));
}

const clip = (text: string | undefined, max = MAX_FIELD_CHARS) => {
  const value = (text || '').trim();
  return value.length > max ? `${value.slice(0, max)}… [truncated — full text on the website]` : value;
};

function platforms(idea: Idea): string[] {
  return [
    idea.eligibleMedium && 'Medium',
    idea.eligibleSubstack && 'Substack',
    idea.eligibleYoutube && 'YouTube',
    idea.eligibleInstagram && 'Instagram',
  ].filter(Boolean) as string[];
}

function summarize(idea: Idea) {
  const formats = [isArticleIdea(idea) && 'article', isVideoIdea(idea) && 'video'].filter(Boolean);
  return {
    id: idea.ideaId,
    title: idea.idea,
    status: isIdeaCompleted(idea) ? 'completed' : 'pending',
    stage: getIdeaPublishStatus(idea).label,
    formats: formats.length ? formats : ['none yet'],
    platforms: platforms(idea),
    created: idea.createdAt?.slice(0, 10),
    date_posted: idea.datePosted ? idea.datePosted.slice(0, 10) : null,
    has_research: hasIdeaResearch(idea),
    has_article: Boolean(idea.mediumArticle?.trim()),
    has_video_script: Boolean(idea.youtubeScript?.trim()),
    description: clip(idea.description, 300),
    url: ideaUrl(idea.ideaId),
  };
}

/**
 * Runs a tool for the given user. `userId` comes from the server-side chat link,
 * never from the model, and every query is scoped to it.
 */
export async function executeTool(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'count_ideas': {
      const status = pick(args.status, STATUSES, 'any');
      const type = pick(args.type, TYPES, 'all');
      const ideas = await fetchUserIdeas(supabase, userId);
      return { status, type, count: filterIdeas(ideas, status, type).length };
    }
    case 'list_ideas': {
      const status = pick(args.status, STATUSES, 'any');
      const type = pick(args.type, TYPES, 'all');
      const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 100);
      const matched = filterIdeas(await fetchUserIdeas(supabase, userId), status, type);
      return { status, type, total: matched.length, ideas: matched.slice(0, limit).map(summarize) };
    }
    case 'search_ideas': {
      const words = String(args.query || '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (!words.length) return { error: 'query is empty' };
      const ideas = await fetchUserIdeas(supabase, userId);
      const matches = ideas.filter((idea) => {
        const haystack = [idea.idea, idea.description, idea.baseArticle, idea.mediumArticle, idea.youtubeScript]
          .join(' ')
          .toLowerCase();
        return words.every((word) => haystack.includes(word));
      });
      return { total: matches.length, ideas: matches.slice(0, 25).map(summarize) };
    }
    case 'get_idea_details': {
      const ideaId = String(args.idea_id || '');
      if (!/^[0-9a-f-]{36}$/i.test(ideaId)) return { error: 'invalid idea_id' };
      const idea = await fetchUserIdeaById(supabase, userId, ideaId);
      if (!idea) return { error: 'idea not found' };
      return {
        ...summarize(idea),
        description: clip(idea.description),
        research_notes: clip(idea.baseArticle),
        article_draft: clip(idea.mediumArticle),
        video_script: clip(idea.youtubeScript),
      };
    }
    case 'list_prompts': {
      const { data, error } = await supabase
        .from('prompts')
        .select('title, content, created_at')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const query = String(args.query || '').toLowerCase().trim();
      const rows = (data || []).filter(
        (row) => !query || `${row.title} ${row.content}`.toLowerCase().includes(query)
      );
      return {
        total: rows.length,
        prompts: rows.slice(0, 30).map((row) => ({ title: row.title, content: clip(row.content, 2000) })),
      };
    }
    case 'create_idea': {
      const title = String(args.title || '').trim();
      if (!title) return { error: 'title is required' };
      if (title.length > 300) return { error: 'title is too long (max 300 characters)' };
      const stage = pick(args.stage, STAGES, 'article_and_video');
      const description = String(args.description || '').trim();
      const research = String(args.research_notes || '').trim();

      const idea = await createUserIdea(supabase, userId, {
        idea: title,
        description,
        baseArticle: research || description,
        formats: {
          article: stage === 'article' || stage === 'article_and_video',
          video: stage === 'video' || stage === 'article_and_video',
        },
        completed: args.completed === true,
      });

      // Keep the similar-ideas search index in sync without delaying the chat reply.
      after(async () => {
        try {
          await upsertIdeaVector({
            ideaId: idea.ideaId,
            title: idea.idea,
            notes: [idea.baseArticle, idea.description].filter(Boolean).join('\n'),
          });
        } catch (error) {
          console.warn('Telegram-created idea saved, but the search index was not updated:', error);
        }
      });

      return { created: true, idea: summarize(idea) };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}
