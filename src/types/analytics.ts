export interface TopicTimeStats {
  ideaId: string;
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
