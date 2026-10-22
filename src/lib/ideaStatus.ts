export interface PublishStatus {
  status: 'completed' | 'ready-to-complete' | 'pending' | 'articles' | 'videos' | 'articles-and-videos';
  label: string;
  badgeClass: string;
  dotClass: string;
  borderClass: string;
  bgClass: string;
  accentGradient: string;
}

export type IdeaChecklistFields = {
  status?: string;
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
  articleDraftedDone?: boolean;
  articleDraftedAt?: string;
  articlePublishedDone?: boolean;
  articlePublishedAt?: string;
  videoShootingDone?: boolean;
  videoShootingAt?: string;
  videoEditingDone?: boolean;
  videoEditingAt?: string;
  videoUploadedDone?: boolean;
  videoUploadedAt?: string;
};

export type IdeaTypeFilter = 'all' | 'research' | 'article' | 'video';
export type IdeaStatusFilter = 'pending' | 'completed';

/**
 * Checks if an idea has been finalized and marked as completed.
 */
export const isIdeaCompleted = (idea: IdeaChecklistFields): boolean => {
  return idea.status === 'posted' || idea.status === 'completed';
};

export const isArticleIdea = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.eligibleMedium || idea.eligibleSubstack);
};

export const isVideoIdea = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.eligibleYoutube || idea.eligibleInstagram);
};

export const hasIdeaResearch = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.baseArticle && idea.baseArticle.trim().length > 0);
};

export const isArticlePublished = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack);
};

export const isVideoPublished = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram);
};

/**
 * Filter evaluation for the dual-group filter system:
 * Group 1 (Type): 'all' | 'research' | 'article' | 'video'
 * Group 2 (Status): 'pending' | 'completed'
 */
export const matchesIdeaFilters = (
  idea: IdeaChecklistFields,
  typeFilter: IdeaTypeFilter = 'all',
  statusFilter: IdeaStatusFilter = 'pending'
): boolean => {
  const completed = isIdeaCompleted(idea);
  const articleSelected = isArticleIdea(idea);
  const videoSelected = isVideoIdea(idea);
  const articleDone = isArticlePublished(idea) || completed;
  const videoDone = isVideoPublished(idea) || completed;
  const researchDone = hasIdeaResearch(idea) || completed;

  if (statusFilter === 'completed') {
    if (typeFilter === 'all') return completed;
    if (typeFilter === 'research') return researchDone;
    if (typeFilter === 'article') return articleSelected && articleDone;
    if (typeFilter === 'video') return videoSelected && videoDone;
  } else {
    // statusFilter === 'pending'
    if (typeFilter === 'all') return !completed;
    if (typeFilter === 'research') return !completed && (!hasIdeaResearch(idea) || (!articleSelected && !videoSelected));
    if (typeFilter === 'article') return articleSelected && !articleDone && !completed;
    if (typeFilter === 'video') return videoSelected && !videoDone && !completed;
  }

  return true;
};

/**
 * Stage 1: Pending
 * Awaiting initial research submission and format selection (Article / Video questions).
 */
export const isIdeaPending = (idea: IdeaChecklistFields): boolean => {
  if (isIdeaCompleted(idea)) return false;
  const isArticleRequired = Boolean(idea.eligibleMedium || idea.eligibleSubstack);
  const isVideoRequired = Boolean(idea.eligibleYoutube || idea.eligibleInstagram);
  return !isArticleRequired && !isVideoRequired;
};

/**
 * Stage 2: Articles
 * Ideas where the user chose to write an article and it is in progress (not published yet).
 */
export const isIdeaForArticles = (idea: IdeaChecklistFields): boolean => {
  if (isIdeaCompleted(idea)) return false;
  const isArticleRequired = Boolean(idea.eligibleMedium || idea.eligibleSubstack);
  const isArticlePub = isArticlePublished(idea);
  return isArticleRequired && !isArticlePub;
};

/**
 * Stage 3: Videos
 * Ideas where the user chose to create a video and the video script is in progress (not published/uploaded yet).
 */
export const isIdeaForVideos = (idea: IdeaChecklistFields): boolean => {
  if (isIdeaCompleted(idea)) return false;
  const isVideoRequired = Boolean(idea.eligibleYoutube || idea.eligibleInstagram);
  const isVideoPub = isVideoPublished(idea);
  return isVideoRequired && !isVideoPub;
};

/**
 * Checks if all required publication criteria are met so the idea can be totally completed.
 * An idea can be completed only if the article is published (if chosen) and the video is published (if chosen).
 */
export const canCompleteIdea = (idea: IdeaChecklistFields): { allowed: boolean; reason?: string } => {
  const isArticleRequired = Boolean(idea.eligibleMedium || idea.eligibleSubstack);
  const isVideoRequired = Boolean(idea.eligibleYoutube || idea.eligibleInstagram);
  const isArticlePublished = Boolean(idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack);
  const isVideoPublished = Boolean(idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram);

  // If neither format was selected yet
  if (!isArticleRequired && !isVideoRequired) {
    return {
      allowed: false,
      reason: 'Please paste initial research and select whether you are creating an Article or Video first.',
    };
  }

  const missing: string[] = [];
  if (isArticleRequired && !isArticlePublished) missing.push('Article');
  if (isVideoRequired && !isVideoPublished) missing.push('Video');

  if (missing.length > 0) {
    return {
      allowed: false,
      reason: `Cannot complete idea yet: ${missing.join(' and ')} must be published first.`,
    };
  }

  return { allowed: true };
};

/**
 * Determines the visual badge, styling, and label for an idea according to the new stages.
 */
export const getIdeaPublishStatus = (i: IdeaChecklistFields): PublishStatus => {
  if (isIdeaCompleted(i)) {
    return {
      status: 'completed',
      label: 'Completed',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-500',
      borderClass: 'border-l-emerald-500',
      bgClass: 'bg-emerald-500/[0.02]',
      accentGradient: 'from-emerald-500/80 via-emerald-400/40 to-transparent',
    };
  }

  const isArticleRequired = Boolean(i.eligibleMedium || i.eligibleSubstack);
  const isVideoRequired = Boolean(i.eligibleYoutube || i.eligibleInstagram);
  const isArticlePublished = Boolean(i.articlePublishedDone || i.publishedMedium || i.publishedSubstack);
  const isVideoPublished = Boolean(i.videoUploadedDone || i.publishedYoutube || i.publishedInstagram);

  // Stage 1: Pending (No formats selected yet / awaiting research)
  if (!isArticleRequired && !isVideoRequired) {
    return {
      status: 'pending',
      label: 'Pending',
      badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      dotClass: 'bg-violet-500',
      borderClass: 'border-l-violet-500',
      bgClass: 'bg-violet-500/[0.02]',
      accentGradient: 'from-violet-500/80 via-violet-400/40 to-transparent',
    };
  }

  const articleDone = !isArticleRequired || isArticlePublished;
  const videoDone = !isVideoRequired || isVideoPublished;

  // Ready to complete (all required published, awaiting user click on Completed button)
  if (articleDone && videoDone) {
    return {
      status: 'ready-to-complete',
      label: 'Ready to Complete',
      badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25',
      dotClass: 'bg-teal-500',
      borderClass: 'border-l-teal-500',
      bgClass: 'bg-teal-500/[0.02]',
      accentGradient: 'from-teal-500/80 via-teal-400/40 to-transparent',
    };
  }

  // Both formats in progress
  if (isArticleRequired && isVideoRequired && !isArticlePublished && !isVideoPublished) {
    return {
      status: 'articles-and-videos',
      label: 'Articles & Videos',
      badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      dotClass: 'bg-indigo-500',
      borderClass: 'border-l-indigo-500',
      bgClass: 'bg-indigo-500/[0.02]',
      accentGradient: 'from-indigo-500/80 via-indigo-400/40 to-transparent',
    };
  }

  // Article in progress
  if (isArticleRequired && !isArticlePublished) {
    const label = i.articleDraftedDone ? 'Article Drafted' : 'Writing Article';
    return {
      status: 'articles',
      label,
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dotClass: 'bg-amber-500',
      borderClass: 'border-l-amber-500',
      bgClass: 'bg-amber-500/[0.02]',
      accentGradient: 'from-amber-500/80 via-amber-400/40 to-transparent',
    };
  }

  // Video in progress
  let videoLabel = 'Writing Video';
  if (i.videoEditingDone) {
    videoLabel = 'Editing Done';
  } else if (i.videoShootingDone) {
    videoLabel = 'Shooting Done';
  }

  return {
    status: 'videos',
    label: videoLabel,
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    dotClass: 'bg-rose-500',
    borderClass: 'border-l-rose-500',
    bgClass: 'bg-rose-500/[0.02]',
    accentGradient: 'from-rose-500/80 via-rose-400/40 to-transparent',
  };
};
