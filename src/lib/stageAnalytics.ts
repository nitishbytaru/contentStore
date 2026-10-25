import {
  Idea,
  StageDurationStat,
  FunnelStep,
  ConversionAnalytics,
} from '@/types';
import { StageCategory } from '@/enums';
import { 
  hasIdeaResearch, 
  isArticleIdea, 
  isVideoIdea, 
  isArticlePublished, 
  isVideoPublished, 
  isIdeaCompleted 
} from '@/lib/ideaStatus';

export type { StageDurationStat, FunnelStep, ConversionAnalytics };
export { StageCategory };

function parseTime(val?: string | null): number | null {
  if (!val) return null;
  const t = new Date(val).getTime();
  return isNaN(t) ? null : t;
}

export function formatDurationHuman(hours: number): string {
  if (hours <= 0) return '0 hrs';
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins} mins`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} hrs`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)} days`;
}

function calculateDiffs(
  ideas: Idea[],
  getStart: (idea: Idea) => number | null,
  getEnd: (idea: Idea) => number | null
): { avgHours: number; count: number; fastest?: string; slowest?: string } {
  const diffsInHours: number[] = [];

  for (const idea of ideas) {
    const start = getStart(idea);
    const end = getEnd(idea);
    if (start !== null && end !== null && end >= start) {
      const diffHours = (end - start) / (1000 * 60 * 60);
      diffsInHours.push(diffHours);
    }
  }

  if (diffsInHours.length === 0) {
    return { avgHours: 0, count: 0 };
  }

  const sum = diffsInHours.reduce((acc, v) => acc + v, 0);
  const avgHours = sum / diffsInHours.length;
  const minHours = Math.min(...diffsInHours);
  const maxHours = Math.max(...diffsInHours);

  return {
    avgHours,
    count: diffsInHours.length,
    fastest: formatDurationHuman(minHours),
    slowest: formatDurationHuman(maxHours),
  };
}

export function calculateConversionAnalytics(ideas: Idea[]): ConversionAnalytics {
  const totalIdeas = ideas.length;

  // 1. Researched vs Unresearched
  const researchedIdeas = ideas.filter(hasIdeaResearch);
  const researchedCount = researchedIdeas.length;
  const unresearchedCount = totalIdeas - researchedCount;
  const researchedRate = totalIdeas > 0 ? (researchedCount / totalIdeas) * 100 : 0;
  const unresearchedRate = totalIdeas > 0 ? (unresearchedCount / totalIdeas) * 100 : 0;

  // 2. Format Converted
  const articleIdeas = ideas.filter(isArticleIdea);
  const videoIdeas = ideas.filter(isVideoIdea);
  const bothIdeas = ideas.filter(i => isArticleIdea(i) && isVideoIdea(i));
  const neitherIdeas = researchedIdeas.filter(i => !isArticleIdea(i) && !isVideoIdea(i));

  const articleCount = articleIdeas.length;
  const videoCount = videoIdeas.length;
  const bothCount = bothIdeas.length;
  const neitherCount = neitherIdeas.length;

  const baseForFormats = researchedCount > 0 ? researchedCount : (totalIdeas || 1);
  const articleRate = (articleCount / baseForFormats) * 100;
  const videoRate = (videoCount / baseForFormats) * 100;
  const neitherRate = (neitherCount / baseForFormats) * 100;

  // 3. Article Pipeline
  const articlesDrafted = articleIdeas.filter(i => Boolean(i.articleDraftedDone || (i.mediumArticle && i.mediumArticle.trim()))).length;
  const articlesPublished = articleIdeas.filter(isArticlePublished).length;
  const articlesPending = articleCount - articlesPublished;
  const articlePublishRate = articleCount > 0 ? (articlesPublished / articleCount) * 100 : 0;
  const articleDropRate = 100 - articlePublishRate;

  // 4. Video Pipeline
  const videosScripted = videoIdeas.filter(i => Boolean(i.youtubeScript && i.youtubeScript.trim()) || i.videoShootingDone).length;
  const videosShot = videoIdeas.filter(i => Boolean(i.videoShootingDone)).length;
  const videosEdited = videoIdeas.filter(i => Boolean(i.videoEditingDone)).length;
  const videosUploaded = videoIdeas.filter(isVideoPublished).length;
  const videosPending = videoCount - videosUploaded;
  const videoUploadRate = videoCount > 0 ? (videosUploaded / videoCount) * 100 : 0;
  const videoDropRate = 100 - videoUploadRate;

  // 5. Stage Durations Calculation
  const ideationToDraftStats = calculateDiffs(
    articleIdeas,
    (i) => parseTime(i.createdAt),
    (i) => parseTime(i.articleDraftedAt)
  );

  const draftToPublishStats = calculateDiffs(
    articleIdeas,
    (i) => parseTime(i.articleDraftedAt),
    (i) => parseTime(i.articlePublishedAt)
  );

  const totalArticleTimeStats = calculateDiffs(
    articleIdeas,
    (i) => parseTime(i.createdAt),
    (i) => parseTime(i.articlePublishedAt)
  );

  const ideationToShootingStats = calculateDiffs(
    videoIdeas,
    (i) => parseTime(i.createdAt),
    (i) => parseTime(i.videoShootingAt)
  );

  const shootingToEditingStats = calculateDiffs(
    videoIdeas,
    (i) => parseTime(i.videoShootingAt),
    (i) => parseTime(i.videoEditingAt)
  );

  const editingToUploadStats = calculateDiffs(
    videoIdeas,
    (i) => parseTime(i.videoEditingAt),
    (i) => parseTime(i.videoUploadedAt)
  );

  const totalVideoTimeStats = calculateDiffs(
    videoIdeas,
    (i) => parseTime(i.createdAt),
    (i) => parseTime(i.videoUploadedAt)
  );

  const totalIdeaLeadTimeStats = calculateDiffs(
    ideas.filter(isIdeaCompleted),
    (i) => parseTime(i.createdAt),
    (i) => parseTime(i.datePosted)
  );

  const stageDurationsList: StageDurationStat[] = [
    {
      id: 'article-draft',
      stageName: 'Ideation → Draft Article',
      category: StageCategory.ARTICLE,
      avgHours: ideationToDraftStats.avgHours,
      avgDays: ideationToDraftStats.avgHours / 24,
      formattedAvg: formatDurationHuman(ideationToDraftStats.avgHours),
      sampleCount: ideationToDraftStats.count,
      fastestFormatted: ideationToDraftStats.fastest,
      slowestFormatted: ideationToDraftStats.slowest,
      color: '#10b981',
    },
    {
      id: 'article-publish',
      stageName: 'Draft Article → Published',
      category: StageCategory.ARTICLE,
      avgHours: draftToPublishStats.avgHours,
      avgDays: draftToPublishStats.avgHours / 24,
      formattedAvg: formatDurationHuman(draftToPublishStats.avgHours),
      sampleCount: draftToPublishStats.count,
      fastestFormatted: draftToPublishStats.fastest,
      slowestFormatted: draftToPublishStats.slowest,
      color: '#059669',
    },
    {
      id: 'video-shoot',
      stageName: 'Ideation → Video Shooting',
      category: StageCategory.VIDEO,
      avgHours: ideationToShootingStats.avgHours,
      avgDays: ideationToShootingStats.avgHours / 24,
      formattedAvg: formatDurationHuman(ideationToShootingStats.avgHours),
      sampleCount: ideationToShootingStats.count,
      fastestFormatted: ideationToShootingStats.fastest,
      slowestFormatted: ideationToShootingStats.slowest,
      color: '#f43f5e',
    },
    {
      id: 'video-edit',
      stageName: 'Shooting → Editing Done',
      category: StageCategory.VIDEO,
      avgHours: shootingToEditingStats.avgHours,
      avgDays: shootingToEditingStats.avgHours / 24,
      formattedAvg: formatDurationHuman(shootingToEditingStats.avgHours),
      sampleCount: shootingToEditingStats.count,
      fastestFormatted: shootingToEditingStats.fastest,
      slowestFormatted: shootingToEditingStats.slowest,
      color: '#e11d48',
    },
    {
      id: 'video-upload',
      stageName: 'Editing Done → Uploaded',
      category: StageCategory.VIDEO,
      avgHours: editingToUploadStats.avgHours,
      avgDays: editingToUploadStats.avgHours / 24,
      formattedAvg: formatDurationHuman(editingToUploadStats.avgHours),
      sampleCount: editingToUploadStats.count,
      fastestFormatted: editingToUploadStats.fastest,
      slowestFormatted: editingToUploadStats.slowest,
      color: '#be123c',
    },
  ];

  // Identify slowest bottleneck and fastest stages among those with samples
  const activeStats = stageDurationsList.filter(s => s.sampleCount > 0);
  let slowestStage: StageDurationStat | null = null;
  let fastestStage: StageDurationStat | null = null;

  if (activeStats.length > 0) {
    slowestStage = [...activeStats].sort((a, b) => b.avgHours - a.avgHours)[0];
    fastestStage = [...activeStats].sort((a, b) => a.avgHours - b.avgHours)[0];
  }

  // 6. Funnel Steps
  const funnelSteps: FunnelStep[] = [
    {
      name: '1. Ideas Created',
      count: totalIdeas,
      percentageOfTotal: 100,
      conversionRateFromPrev: 100,
      dropOffCount: 0,
      dropOffRate: 0,
      color: '#8b5cf6',
      description: 'Total brainstorming entries in the ideas pool',
    },
    {
      name: '2. Researched',
      count: researchedCount,
      percentageOfTotal: totalIdeas > 0 ? (researchedCount / totalIdeas) * 100 : 0,
      conversionRateFromPrev: totalIdeas > 0 ? (researchedCount / totalIdeas) * 100 : 0,
      dropOffCount: unresearchedCount,
      dropOffRate: unresearchedRate,
      color: '#3b82f6',
      description: 'Ideas with initial research completed',
    },
    {
      name: '3. Formats Assigned',
      count: articleCount + videoCount - bothCount,
      percentageOfTotal: totalIdeas > 0 ? ((articleCount + videoCount - bothCount) / totalIdeas) * 100 : 0,
      conversionRateFromPrev: researchedCount > 0 ? ((articleCount + videoCount - bothCount) / researchedCount) * 100 : 0,
      dropOffCount: neitherCount,
      dropOffRate: neitherRate,
      color: '#f59e0b',
      description: 'Converted into Article, Video, or Both',
    },
    {
      name: '4. Published / Uploaded',
      count: articlesPublished + videosUploaded,
      percentageOfTotal: totalIdeas > 0 ? ((articlesPublished + videosUploaded) / totalIdeas) * 100 : 0,
      conversionRateFromPrev: (articleCount + videoCount) > 0 ? ((articlesPublished + videosUploaded) / (articleCount + videoCount)) * 100 : 0,
      dropOffCount: articlesPending + videosPending,
      dropOffRate: (articleCount + videoCount) > 0 ? ((articlesPending + videosPending) / (articleCount + videoCount)) * 100 : 0,
      color: '#10b981',
      description: 'Fully live content published across channels',
    },
  ];

  return {
    totalIdeas,
    researched: {
      count: researchedCount,
      rate: researchedRate,
      unresearchedCount,
      unresearchedRate,
    },
    formats: {
      articles: articleCount,
      videos: videoCount,
      both: bothCount,
      neither: neitherCount,
      articleRate,
      videoRate,
      neitherRate,
    },
    articlePipeline: {
      total: articleCount,
      drafted: articlesDrafted,
      published: articlesPublished,
      pending: articlesPending,
      publishRate: articlePublishRate,
      dropRate: articleDropRate,
    },
    videoPipeline: {
      total: videoCount,
      scripted: videosScripted,
      shot: videosShot,
      edited: videosEdited,
      uploaded: videosUploaded,
      pending: videosPending,
      uploadRate: videoUploadRate,
      dropRate: videoDropRate,
    },
    stageDurations: {
      ideationToDraft: stageDurationsList[0],
      draftToPublish: stageDurationsList[1],
      totalArticleTime: {
        id: 'total-article',
        stageName: 'Total Article Lead Time',
        category: StageCategory.ARTICLE,
        avgHours: totalArticleTimeStats.avgHours,
        avgDays: totalArticleTimeStats.avgHours / 24,
        formattedAvg: formatDurationHuman(totalArticleTimeStats.avgHours),
        sampleCount: totalArticleTimeStats.count,
        fastestFormatted: totalArticleTimeStats.fastest,
        slowestFormatted: totalArticleTimeStats.slowest,
        color: '#10b981',
      },
      ideationToShooting: stageDurationsList[2],
      shootingToEditing: stageDurationsList[3],
      editingToUpload: stageDurationsList[4],
      totalVideoTime: {
        id: 'total-video',
        stageName: 'Total Video Lead Time',
        category: StageCategory.VIDEO,
        avgHours: totalVideoTimeStats.avgHours,
        avgDays: totalVideoTimeStats.avgHours / 24,
        formattedAvg: formatDurationHuman(totalVideoTimeStats.avgHours),
        sampleCount: totalVideoTimeStats.count,
        fastestFormatted: totalVideoTimeStats.fastest,
        slowestFormatted: totalVideoTimeStats.slowest,
        color: '#f43f5e',
      },
      totalIdeaLeadTime: {
        id: 'total-lead',
        stageName: 'End-to-End Idea Completion',
        category: StageCategory.OVERALL,
        avgHours: totalIdeaLeadTimeStats.avgHours,
        avgDays: totalIdeaLeadTimeStats.avgHours / 24,
        formattedAvg: formatDurationHuman(totalIdeaLeadTimeStats.avgHours),
        sampleCount: totalIdeaLeadTimeStats.count,
        fastestFormatted: totalIdeaLeadTimeStats.fastest,
        slowestFormatted: totalIdeaLeadTimeStats.slowest,
        color: '#8b5cf6',
      },
      chartStages: stageDurationsList,
      slowestStage,
      fastestStage,
    },
    funnelSteps,
  };
}
