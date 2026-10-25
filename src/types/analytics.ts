import { StageCategory } from '@/enums';

export { StageCategory };

export interface StageDurationStat {
  id: string;
  stageName: string;
  category: StageCategory;
  avgHours: number;
  avgDays: number;
  formattedAvg: string;
  sampleCount: number;
  fastestFormatted?: string;
  slowestFormatted?: string;
  color: string;
}

export interface FunnelStep {
  name: string;
  count: number;
  percentageOfTotal: number;
  conversionRateFromPrev: number;
  dropOffCount: number;
  dropOffRate: number;
  color: string;
  description: string;
}

export interface ConversionAnalytics {
  totalIdeas: number;
  researched: {
    count: number;
    rate: number;
    unresearchedCount: number;
    unresearchedRate: number;
  };
  formats: {
    articles: number;
    videos: number;
    both: number;
    neither: number;
    articleRate: number;
    videoRate: number;
    neitherRate: number;
  };
  articlePipeline: {
    total: number;
    drafted: number;
    published: number;
    pending: number;
    publishRate: number;
    dropRate: number;
  };
  videoPipeline: {
    total: number;
    scripted: number;
    shot: number;
    edited: number;
    uploaded: number;
    pending: number;
    uploadRate: number;
    dropRate: number;
  };
  stageDurations: {
    ideationToDraft: StageDurationStat;
    draftToPublish: StageDurationStat;
    totalArticleTime: StageDurationStat;
    ideationToShooting: StageDurationStat;
    shootingToEditing: StageDurationStat;
    editingToUpload: StageDurationStat;
    totalVideoTime: StageDurationStat;
    totalIdeaLeadTime: StageDurationStat;
    chartStages: StageDurationStat[];
    slowestStage: StageDurationStat | null;
    fastestStage: StageDurationStat | null;
  };
  funnelSteps: FunnelStep[];
}

export interface TopicTimeStats {
  id: string;
  topic: string;
  fullName: string;
  totalSeconds: number;
  minutes: number;
  hours: number;
  formattedTime: string;
  researchMinutes: number;
  articleMinutes: number;
  videoMinutes: number;
  isPublished: boolean;
}

export interface TopicTimeAnalytics {
  topics: TopicTimeStats[];
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  totalHoursFormatted: string;
  averageMinutes: number;
  topTopic: TopicTimeStats | null;
  pieData: { name: string; fullName: string; value: number; formatted: string }[];
  stageBreakdown: {
    stage: string;
    hours: number;
    minutes: number;
    color: string;
  }[];
  bracketDistribution: {
    bracket: string;
    count: number;
  }[];
}
