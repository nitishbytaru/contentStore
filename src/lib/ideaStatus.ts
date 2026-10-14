export interface PublishStatus {
  status: 'published' | 'pending-x' | 'pending-articles' | 'pending-videos' | 'pending' | 'ineligible' | 'untouched';
  label: string;
  badgeClass: string;
  dotClass: string;
  borderClass: string;
  bgClass: string;
  accentGradient: string;
}

export type IdeaChecklistFields = {
  status?: string;
  eligibleX?: boolean;
  publishedX?: boolean;
  ineligibleX?: boolean;
  eligibleMedium?: boolean;
  publishedMedium?: boolean;
  ineligibleMedium?: boolean;
  eligibleSubstack?: boolean;
  publishedSubstack?: boolean;
  ineligibleSubstack?: boolean;
  eligibleYoutube?: boolean;
  publishedYoutube?: boolean;
  ineligibleYoutube?: boolean;
  eligibleInstagram?: boolean;
  publishedInstagram?: boolean;
  ineligibleInstagram?: boolean;
  baseArticle?: string;
  mediumArticle?: string;
  youtubeScript?: string;
};

export const getIdeaPublishStatus = (i: IdeaChecklistFields): PublishStatus => {
  if (i.status === 'posted') {
    return {
      status: 'published',
      label: 'Published',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-500',
      borderClass: 'border-l-emerald-500',
      bgClass: 'bg-emerald-500/[0.02]',
      accentGradient: 'from-emerald-500/80 via-emerald-400/40 to-transparent',
    };
  }

  // 1. Channel X
  const isXPublished = Boolean(i.publishedX);
  const isXIneligible = !isXPublished && Boolean(i.ineligibleX);
  const isXDone = isXPublished || isXIneligible;

  // 2. Channel Articles (Medium & Substack)
  const isArticlesPublished = Boolean(i.publishedMedium || i.publishedSubstack);
  const isArticlesIneligible = !isArticlesPublished && Boolean(i.ineligibleMedium || i.ineligibleSubstack);
  const isArticlesDone = isArticlesPublished || isArticlesIneligible;

  // 3. Channel Videos (YouTube & Instagram)
  const isVideosPublished = Boolean(i.publishedYoutube || i.publishedInstagram);
  const isVideosIneligible = !isVideosPublished && Boolean(i.ineligibleYoutube || i.ineligibleInstagram);
  const isVideosDone = isVideosPublished || isVideosIneligible;

  // Has any platform or content been touched?
  const hasChecklist = Boolean(
    i.eligibleX || i.ineligibleX || i.publishedX ||
    i.eligibleMedium || i.ineligibleMedium || i.publishedMedium ||
    i.eligibleSubstack || i.ineligibleSubstack || i.publishedSubstack ||
    i.eligibleYoutube || i.ineligibleYoutube || i.publishedYoutube ||
    i.eligibleInstagram || i.ineligibleInstagram || i.publishedInstagram
  );
  const hasContent = Boolean(
    (i.baseArticle && i.baseArticle.trim() !== '') ||
    (i.mediumArticle && i.mediumArticle.trim() !== '') ||
    (i.youtubeScript && i.youtubeScript.trim() !== '')
  );

  if (!hasChecklist && !hasContent) {
    return {
      status: 'untouched',
      label: 'Untouched',
      badgeClass: 'bg-muted/60 text-muted-foreground border-border/60',
      dotClass: 'bg-muted-foreground/50',
      borderClass: 'border-l-muted-foreground/40',
      bgClass: 'bg-muted/[0.02]',
      accentGradient: 'from-muted-foreground/40 via-border/40 to-transparent',
    };
  }

  // All 3 channels filled completely
  const allChannelsDone = isXDone && isArticlesDone && isVideosDone;
  const anyChannelPublished = isXPublished || isArticlesPublished || isVideosPublished;

  if (allChannelsDone) {
    if (anyChannelPublished) {
      return {
        status: 'published',
        label: 'Published',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dotClass: 'bg-emerald-500',
        borderClass: 'border-l-emerald-500',
        bgClass: 'bg-emerald-500/[0.02]',
        accentGradient: 'from-emerald-500/80 via-emerald-400/40 to-transparent',
      };
    } else {
      // All 3 channels ineligible
      return {
        status: 'ineligible',
        label: 'Ineligible',
        badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        dotClass: 'bg-slate-500',
        borderClass: 'border-l-slate-400',
        bgClass: 'bg-slate-500/[0.02]',
        accentGradient: 'from-slate-500/80 via-slate-400/40 to-transparent',
      };
    }
  }

  // Identify non-done channels
  const pendingChannels: string[] = [];
  if (!isXDone) pendingChannels.push('X');
  if (!isArticlesDone) pendingChannels.push('Articles');
  if (!isVideosDone) pendingChannels.push('Videos');

  // Exactly 1 channel pending
  if (pendingChannels.length === 1) {
    const channel = pendingChannels[0];
    if (channel === 'X') {
      return {
        status: 'pending-x',
        label: 'Pending X',
        badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        dotClass: 'bg-sky-500',
        borderClass: 'border-l-sky-500',
        bgClass: 'bg-sky-500/[0.02]',
        accentGradient: 'from-sky-500/80 via-sky-400/40 to-transparent',
      };
    }
    if (channel === 'Articles') {
      return {
        status: 'pending-articles',
        label: 'Pending Articles',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        dotClass: 'bg-amber-500',
        borderClass: 'border-l-amber-500',
        bgClass: 'bg-amber-500/[0.02]',
        accentGradient: 'from-amber-500/80 via-amber-400/40 to-transparent',
      };
    }
    if (channel === 'Videos') {
      return {
        status: 'pending-videos',
        label: 'Pending Videos',
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        dotClass: 'bg-rose-500',
        borderClass: 'border-l-rose-500',
        bgClass: 'bg-rose-500/[0.02]',
        accentGradient: 'from-rose-500/80 via-rose-400/40 to-transparent',
      };
    }
  }

  // Multiple channels pending
  return {
    status: 'pending',
    label: 'Pending',
    badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    dotClass: 'bg-violet-500',
    borderClass: 'border-l-violet-500',
    bgClass: 'bg-violet-500/[0.02]',
    accentGradient: 'from-violet-500/80 via-violet-400/40 to-transparent',
  };
};

export const isIdeaPending = (idea: IdeaChecklistFields): boolean => {
  const status = getIdeaPublishStatus(idea);
  return status.status.startsWith('pending');
};

export const isIdeaCompleted = (idea: IdeaChecklistFields): boolean => {
  const status = getIdeaPublishStatus(idea);
  return status.status === 'published' || status.status === 'ineligible';
};
