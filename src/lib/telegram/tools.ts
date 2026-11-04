import { SupabaseClient } from '@supabase/supabase-js';
import { fetchUserIdeaById, fetchUserIdeas } from '@/lib/supabase/ideas';
import { getIdeaPublishStatus, isIdeaCompleted, matchesIdeaFilters } from '@/utils/ideaStatus';
import { Idea, IdeaStatusFilter, IdeaTypeFilter } from '@/types';

const STATUSES = ['pending', 'completed', 'any'] as const;
const TYPES = ['all', 'research', 'article', 'video'] as const;

type StatusArg = (typeof STATUSES)[number];
type TypeArg = (typeof TYPES)[number];

const statusParam = {
  type: 'string',
  enum: STATUSES,
  description: "'pending' = not completed yet, 'completed' = posted/done, 'any' = both. Defaults to 'pending'.",
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
      description: "List the user's content ideas (newest first) with id, title, stage and created date.",
      parameters: {
        type: 'object',
        properties: {
          status: statusParam,
          type: typeParam,
          limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Max ideas to return. Defaults to 15.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_ideas',
      description: "Keyword search over the user's idea titles and descriptions.",
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
      description: 'Get details for one idea: description, stage, and whether research, article and video script exist.',
      parameters: {
        type: 'object',
        properties: { idea_id: { type: 'string', description: 'The idea id from list_ideas or search_ideas.' } },
        required: ['idea_id'],
      },
    },
  },
];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function filterIdeas(ideas: Idea[], status: StatusArg, type: TypeArg): Idea[] {
  if (status === 'any') {
    return ideas.filter(
      (idea) =>
        matchesIdeaFilters(idea, type as IdeaTypeFilter, 'pending' as IdeaStatusFilter) ||
        matchesIdeaFilters(idea, type as IdeaTypeFilter, 'completed' as IdeaStatusFilter)
    );
  }
  return ideas.filter((idea) => matchesIdeaFilters(idea, type as IdeaTypeFilter, status as IdeaStatusFilter));
}

function summarize(idea: Idea) {
  return {
    id: idea.ideaId,
    title: idea.idea,
    stage: getIdeaPublishStatus(idea).label,
    created: idea.createdAt?.slice(0, 10),
  };
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);

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
      const status = pick(args.status, STATUSES, 'pending');
      const type = pick(args.type, TYPES, 'all');
      const ideas = await fetchUserIdeas(supabase, userId);
      return { status, type, count: filterIdeas(ideas, status, type).length };
    }
    case 'list_ideas': {
      const status = pick(args.status, STATUSES, 'pending');
      const type = pick(args.type, TYPES, 'all');
      const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 50);
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
        const haystack = `${idea.idea} ${idea.description}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
      });
      return {
        total: matches.length,
        ideas: matches.slice(0, 20).map((idea) => ({ ...summarize(idea), completed: isIdeaCompleted(idea) })),
      };
    }
    case 'get_idea_details': {
      const ideaId = String(args.idea_id || '');
      if (!/^[0-9a-f-]{36}$/i.test(ideaId)) return { error: 'invalid idea_id' };
      const idea = await fetchUserIdeaById(supabase, userId, ideaId);
      if (!idea) return { error: 'idea not found' };
      return {
        ...summarize(idea),
        description: clip(idea.description || "", 1000),
        completed: isIdeaCompleted(idea),
        date_posted: idea.datePosted || null,
        has_research: Boolean(idea.baseArticle?.trim()),
        has_article: Boolean(idea.mediumArticle?.trim()),
        has_video_script: Boolean(idea.youtubeScript?.trim()),
        article_planned: Boolean(idea.eligibleMedium || idea.eligibleSubstack),
        video_planned: Boolean(idea.eligibleYoutube || idea.eligibleInstagram),
      };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}
