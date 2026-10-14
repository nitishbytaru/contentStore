import { Idea } from '@/store/slices/ideasSlice';

export interface CadenceGoal {
  targetDays: number;
  type: 'article' | 'video';
  title: string;
  lastPublishedDate: Date | null;
  daysSinceLast: number | null;
  daysRemaining: number | null;
  nextDueDate: Date | null;
  status: 'on-track' | 'due-today' | 'overdue' | 'no-posts';
  statusLabel: string;
  progressPercent: number; // 0 to 100
  totalPublished: number;
}

export interface CadenceSummary {
  article: CadenceGoal;
  video: CadenceGoal;
  hasOverdue: boolean;
  hasDueToday: boolean;
  needsReminder: boolean;
}

export const ARTICLE_CADENCE_DAYS = 3;
export const VIDEO_CADENCE_DAYS = 7;

export function calculateCadence(ideas: Idea[]): CadenceSummary {
  const now = new Date();

  // 1. Articles (Medium & Substack)
  const publishedArticles = ideas
    .filter(i => Boolean(i.publishedMedium || i.publishedSubstack))
    .sort((a, b) => {
      const timeA = new Date(a.datePosted || a.createdAt).getTime();
      const timeB = new Date(b.datePosted || b.createdAt).getTime();
      return timeB - timeA;
    });

  const lastArticleIdea = publishedArticles[0] || null;
  const lastArticleDate = lastArticleIdea
    ? new Date(lastArticleIdea.datePosted || lastArticleIdea.createdAt)
    : null;

  let articleDaysSince: number | null = null;
  let articleDaysRemaining: number | null = null;
  let articleNextDue: Date | null = null;
  let articleStatus: CadenceGoal['status'] = 'no-posts';
  let articleStatusLabel = 'No articles published yet';
  let articleProgress = 100;

  if (lastArticleDate && !isNaN(lastArticleDate.getTime())) {
    const diffMs = now.getTime() - lastArticleDate.getTime();
    articleDaysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    articleDaysRemaining = ARTICLE_CADENCE_DAYS - articleDaysSince;
    articleNextDue = new Date(lastArticleDate.getTime() + ARTICLE_CADENCE_DAYS * 24 * 60 * 60 * 1000);

    if (articleDaysRemaining > 0) {
      articleStatus = 'on-track';
      articleStatusLabel = `Due in ${articleDaysRemaining} day${articleDaysRemaining > 1 ? 's' : ''}`;
      articleProgress = Math.min(100, Math.round((articleDaysSince / ARTICLE_CADENCE_DAYS) * 100));
    } else if (articleDaysRemaining === 0) {
      articleStatus = 'due-today';
      articleStatusLabel = 'Due today';
      articleProgress = 100;
    } else {
      articleStatus = 'overdue';
      const overdueBy = Math.abs(articleDaysRemaining);
      articleStatusLabel = `Overdue by ${overdueBy} day${overdueBy > 1 ? 's' : ''}`;
      articleProgress = 100;
    }
  }

  // 2. Videos (YouTube & Instagram)
  const publishedVideos = ideas
    .filter(i => Boolean(i.publishedYoutube || i.publishedInstagram))
    .sort((a, b) => {
      const timeA = new Date(a.datePosted || a.createdAt).getTime();
      const timeB = new Date(b.datePosted || b.createdAt).getTime();
      return timeB - timeA;
    });

  const lastVideoIdea = publishedVideos[0] || null;
  const lastVideoDate = lastVideoIdea
    ? new Date(lastVideoIdea.datePosted || lastVideoIdea.createdAt)
    : null;

  let videoDaysSince: number | null = null;
  let videoDaysRemaining: number | null = null;
  let videoNextDue: Date | null = null;
  let videoStatus: CadenceGoal['status'] = 'no-posts';
  let videoStatusLabel = 'No videos published yet';
  let videoProgress = 100;

  if (lastVideoDate && !isNaN(lastVideoDate.getTime())) {
    const diffMs = now.getTime() - lastVideoDate.getTime();
    videoDaysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    videoDaysRemaining = VIDEO_CADENCE_DAYS - videoDaysSince;
    videoNextDue = new Date(lastVideoDate.getTime() + VIDEO_CADENCE_DAYS * 24 * 60 * 60 * 1000);

    if (videoDaysRemaining > 0) {
      videoStatus = 'on-track';
      videoStatusLabel = `Due in ${videoDaysRemaining} day${videoDaysRemaining > 1 ? 's' : ''}`;
      videoProgress = Math.min(100, Math.round((videoDaysSince / VIDEO_CADENCE_DAYS) * 100));
    } else if (videoDaysRemaining === 0) {
      videoStatus = 'due-today';
      videoStatusLabel = 'Due today';
      videoProgress = 100;
    } else {
      videoStatus = 'overdue';
      const overdueBy = Math.abs(videoDaysRemaining);
      videoStatusLabel = `Overdue by ${overdueBy} day${overdueBy > 1 ? 's' : ''}`;
      videoProgress = 100;
    }
  }

  const hasOverdue = articleStatus === 'overdue' || videoStatus === 'overdue' || articleStatus === 'no-posts' || videoStatus === 'no-posts';
  const hasDueToday = articleStatus === 'due-today' || videoStatus === 'due-today';

  return {
    article: {
      targetDays: ARTICLE_CADENCE_DAYS,
      type: 'article',
      title: 'Article Cadence',
      lastPublishedDate: lastArticleDate,
      daysSinceLast: articleDaysSince,
      daysRemaining: articleDaysRemaining,
      nextDueDate: articleNextDue,
      status: articleStatus,
      statusLabel: articleStatusLabel,
      progressPercent: articleProgress,
      totalPublished: publishedArticles.length,
    },
    video: {
      targetDays: VIDEO_CADENCE_DAYS,
      type: 'video',
      title: 'Video Cadence',
      lastPublishedDate: lastVideoDate,
      daysSinceLast: videoDaysSince,
      daysRemaining: videoDaysRemaining,
      nextDueDate: videoNextDue,
      status: videoStatus,
      statusLabel: videoStatusLabel,
      progressPercent: videoProgress,
      totalPublished: publishedVideos.length,
    },
    hasOverdue,
    hasDueToday,
    needsReminder: hasOverdue || hasDueToday,
  };
}
