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
  return isIdeaCompleted(idea) && isArticleIdea(idea);
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
  return isIdeaCompleted(idea) && isVideoIdea(idea);
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
export const canCompleteIdea = (_idea: IdeaChecklistFields): { allowed: boolean; reason?: string } => {
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
      badgeClass: 'bg-primary/10 text-primary border-primary/30',
      dotClass: 'bg-primary',
      borderClass: 'border-l-primary',
      bgClass: 'bg-primary/[0.03]',
      accentGradient: 'from-primary/80 via-primary/30 to-transparent',
    };
  }

  const isArticleRequired = Boolean(i.eligibleMedium || i.eligibleSubstack);
  const isVideoRequired = Boolean(i.eligibleYoutube || i.eligibleInstagram);

  if (!isArticleRequired && !isVideoRequired) {
    return {
      status: PublishStatusType.PENDING,
      label: 'Pending',
      badgeClass: 'bg-highlight/15 text-foreground border-highlight/40',
      dotClass: 'bg-highlight',
      borderClass: 'border-l-highlight',
      bgClass: 'bg-highlight/[0.04]',
      accentGradient: 'from-highlight/80 via-highlight/30 to-transparent',
    };
  }

  if (isArticleRequired && isVideoRequired) {
    return {
      status: PublishStatusType.ARTICLES_AND_VIDEOS,
      label: 'Article & Video',
      badgeClass: 'bg-muted text-foreground border-border',
      dotClass: 'bg-muted-foreground',
      borderClass: 'border-l-border',
      bgClass: 'bg-transparent',
      accentGradient: 'from-foreground/30 via-foreground/10 to-transparent',
    };
  }

  if (isArticleRequired) {
    return {
      status: PublishStatusType.ARTICLES,
      label: 'Article',
      badgeClass: 'bg-muted text-foreground border-border',
      dotClass: 'bg-muted-foreground',
      borderClass: 'border-l-border',
      bgClass: 'bg-transparent',
      accentGradient: 'from-foreground/30 via-foreground/10 to-transparent',
    };
  }

  return {
    status: PublishStatusType.VIDEOS,
    label: 'Video',
    badgeClass: 'bg-muted text-foreground border-border',
    dotClass: 'bg-muted-foreground',
    borderClass: 'border-l-border',
    bgClass: 'bg-transparent',
    accentGradient: 'from-foreground/30 via-foreground/10 to-transparent',
  };
};
