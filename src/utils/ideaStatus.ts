import {
  PublishStatus,
  IdeaChecklistFields,
  IdeaTypeFilter,
  IdeaStatusFilter,
} from '@/types';
import {
  IdeaStatus,
  IdeaTypeFilter as IdeaTypeFilterEnum,
  IdeaStatusFilter as IdeaStatusFilterEnum,
  PublishStatusType,
} from '@/enums';

/**
 * Checks whether an idea is considered completely finalized and completed.
 *
 * An idea is marked as completed when its status field is set to 'posted' or 'completed'
 * in the database, signifying that all required deliverables (articles/videos) have been shipped.
 *
 * @param idea - An object containing idea checklist and status fields.
 * @returns `true` if the idea status is 'posted' or 'completed', otherwise `false`.
 */
export const isIdeaCompleted = (idea: IdeaChecklistFields): boolean => {
  return idea.status === IdeaStatus.POSTED || idea.status === IdeaStatus.COMPLETED;
};

/**
 * Determines whether an idea has been targeted for written article distribution.
 *
 * An idea qualifies as an article idea if it is marked eligible for either
 * the Medium or Substack publishing channels.
 *
 * @param idea - An object containing publication eligibility flags for the idea.
 * @returns `true` if eligible for Medium or Substack, otherwise `false`.
 */
export const isArticleIdea = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.eligibleMedium || idea.eligibleSubstack);
};

/**
 * Determines whether an idea has been targeted for video content creation.
 *
 * An idea qualifies as a video idea if it is marked eligible for either
 * YouTube or Instagram video channels.
 *
 * @param idea - An object containing publication eligibility flags for the idea.
 * @returns `true` if eligible for YouTube or Instagram, otherwise `false`.
 */
export const isVideoIdea = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.eligibleYoutube || idea.eligibleInstagram);
};

/**
 * Checks whether initial research, outline, or core notes have been provided for an idea.
 *
 * Verifies if the `baseArticle` field contains non-empty, trimmed research content.
 *
 * @param idea - An object containing the `baseArticle` text field.
 * @returns `true` if non-empty research text is present, otherwise `false`.
 */
export const hasIdeaResearch = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.baseArticle && idea.baseArticle.trim().length > 0);
};

/**
 * Checks whether an article idea has been published and released to audiences.
 *
 * An article is considered published if either the explicit `articlePublishedDone`
 * completion checkbox is marked true or the platform-specific published flags
 * (`publishedMedium` or `publishedSubstack`) are checked.
 *
 * @param idea - An object containing article publication status flags.
 * @returns `true` if published on any article channel or marked published, otherwise `false`.
 */
export const isArticlePublished = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack);
};

/**
 * Checks whether a video idea has been uploaded and published across video platforms.
 *
 * A video is considered published if either the `videoUploadedDone` milestone
 * checkbox is marked true or platform-specific upload flags (`publishedYoutube`
 * or `publishedInstagram`) are checked.
 *
 * @param idea - An object containing video upload status flags.
 * @returns `true` if uploaded to YouTube or Instagram or marked uploaded, otherwise `false`.
 */
export const isVideoPublished = (idea: IdeaChecklistFields): boolean => {
  return Boolean(idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram);
};

/**
 * Evaluates whether an idea satisfies the active dual-group filter criteria.
 *
 * Group 1 (Type Filter):
 * - 'all': All ideas regardless of format.
 * - 'research': Ideas awaiting research or whose research phase is completed.
 * - 'article': Ideas selected for article creation.
 * - 'video': Ideas selected for video creation.
 *
 * Group 2 (Status Filter):
 * - 'pending': Active ideas currently in-progress and not fully posted/completed.
 * - 'completed': Ideas whose required pipeline deliverables have been shipped.
 *
 * @param idea - The idea checklist object to evaluate.
 * @param typeFilter - The content format filter ('all' | 'research' | 'article' | 'video'). Defaults to 'all'.
 * @param statusFilter - The completion filter ('pending' | 'completed'). Defaults to 'pending'.
 * @returns `true` if the idea satisfies both filter dimensions, otherwise `false`.
 */
export const matchesIdeaFilters = (
  idea: IdeaChecklistFields,
  typeFilter: IdeaTypeFilter = IdeaTypeFilterEnum.ALL,
  statusFilter: IdeaStatusFilter = IdeaStatusFilterEnum.PENDING
): boolean => {
  const completed = isIdeaCompleted(idea);
  const articleSelected = isArticleIdea(idea);
  const videoSelected = isVideoIdea(idea);
  const articleDone = isArticlePublished(idea) || completed;
  const videoDone = isVideoPublished(idea) || completed;
  const researchDone = hasIdeaResearch(idea) || completed;

  if (statusFilter === IdeaStatusFilterEnum.COMPLETED) {
    if (typeFilter === IdeaTypeFilterEnum.ALL) return completed;
    if (typeFilter === IdeaTypeFilterEnum.RESEARCH) return researchDone;
    if (typeFilter === IdeaTypeFilterEnum.ARTICLE) return articleSelected && articleDone;
    if (typeFilter === IdeaTypeFilterEnum.VIDEO) return videoSelected && videoDone;
  } else {
    // statusFilter === IdeaStatusFilterEnum.PENDING
    if (typeFilter === IdeaTypeFilterEnum.ALL) return !completed;
    if (typeFilter === IdeaTypeFilterEnum.RESEARCH) return !completed && (!hasIdeaResearch(idea) || (!articleSelected && !videoSelected));
    if (typeFilter === IdeaTypeFilterEnum.ARTICLE) return articleSelected && !articleDone && !completed;
    if (typeFilter === IdeaTypeFilterEnum.VIDEO) return videoSelected && !videoDone && !completed;
  }

  return true;
};

/**
 * Identifies whether an idea is in Stage 1: Pending (Unconfigured).
 *
 * An idea is in the initial pending state when it is not yet completed and
 * neither Article nor Video deliverables have been selected yet (awaiting
 * initial research submission and format decisions).
 *
 * @param idea - The idea checklist object to evaluate.
 * @returns `true` if awaiting initial format selection and research, otherwise `false`.
 */
export const isIdeaPending = (idea: IdeaChecklistFields): boolean => {
  if (isIdeaCompleted(idea)) return false;
  const isArticleRequired = Boolean(idea.eligibleMedium || idea.eligibleSubstack);
  const isVideoRequired = Boolean(idea.eligibleYoutube || idea.eligibleInstagram);
  return !isArticleRequired && !isVideoRequired;
};

/**
 * Identifies whether an idea is in Stage 2: Articles in Progress.
 *
 * An idea is in this stage if the user configured an article deliverable
 * (Medium or Substack) and the article has not yet been published.
 *
 * @param idea - The idea checklist object to evaluate.
 * @returns `true` if writing/drafting an article is currently in progress, otherwise `false`.
 */
export const isIdeaForArticles = (idea: IdeaChecklistFields): boolean => {
  if (isIdeaCompleted(idea)) return false;
  const isArticleRequired = Boolean(idea.eligibleMedium || idea.eligibleSubstack);
  const isArticlePub = isArticlePublished(idea);
  return isArticleRequired && !isArticlePub;
};

/**
 * Identifies whether an idea is in Stage 3: Videos in Progress.
 *
 * An idea is in this stage if the user configured a video deliverable
 * (YouTube or Instagram) and the video has not yet been uploaded/published.
 *
 * @param idea - The idea checklist object to evaluate.
 * @returns `true` if video scripting, shooting, or editing is in progress, otherwise `false`.
 */
export const isIdeaForVideos = (idea: IdeaChecklistFields): boolean => {
  if (isIdeaCompleted(idea)) return false;
  const isVideoRequired = Boolean(idea.eligibleYoutube || idea.eligibleInstagram);
  const isVideoPub = isVideoPublished(idea);
  return isVideoRequired && !isVideoPub;
};

/**
 * Validates whether all mandatory publication requirements are satisfied
 * before an idea can be marked as fully completed.
 *
 * Business Rules:
 * 1. At least one deliverable format (Article or Video) must be selected.
 * 2. If an Article was chosen, it MUST be published.
 * 3. If a Video was chosen, it MUST be uploaded.
 *
 * @param idea - The idea checklist object to inspect.
 * @returns An object with `allowed: true` if criteria are met, or `allowed: false` with a descriptive user-facing `reason`.
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
 * Resolves the visual badge styling, color schemes, and human-readable label
 * representing the current lifecycle stage of an idea.
 *
 * Computes:
 * - Completed: All deliverables published and status is posted.
 * - Pending: Fresh idea awaiting initial research and format onboarding questions.
 * - Ready to Complete: All deliverables published, awaiting user click on Complete.
 * - Articles & Videos: Both article drafting and video production are concurrently in progress.
 * - Articles: Article writing in progress (shows 'Article Drafted' if draft milestone is done).
 * - Videos: Video production in progress (shows 'Writing Video', 'Shooting Done', or 'Editing Done').
 *
 * @param i - The idea checklist fields.
 * @returns A `PublishStatus` object containing `status`, `label`, `badgeClass`, `dotClass`, `borderClass`, `bgClass`, and `accentGradient`.
 */
export const getIdeaPublishStatus = (i: IdeaChecklistFields): PublishStatus => {
  if (isIdeaCompleted(i)) {
    return {
      status: PublishStatusType.COMPLETED,
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
      status: PublishStatusType.PENDING,
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
      status: PublishStatusType.READY_TO_COMPLETE,
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
      status: PublishStatusType.ARTICLES_AND_VIDEOS,
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
      status: PublishStatusType.ARTICLES,
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
    status: PublishStatusType.VIDEOS,
    label: videoLabel,
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    dotClass: 'bg-rose-500',
    borderClass: 'border-l-rose-500',
    bgClass: 'bg-rose-500/[0.02]',
    accentGradient: 'from-rose-500/80 via-rose-400/40 to-transparent',
  };
};
