import {
  IdeaStatus as IdeaStatusEnum,
  IdeaTypeFilter as IdeaTypeFilterEnum,
  IdeaStatusFilter as IdeaStatusFilterEnum,
  PublishStatusType as PublishStatusTypeEnum,
  OnboardingStep as OnboardingStepEnum,
} from '@/enums';

export {
  IdeaStatusEnum,
  IdeaTypeFilterEnum,
  IdeaStatusFilterEnum,
  PublishStatusTypeEnum,
  OnboardingStepEnum,
};

export type IdeaStatus = `${IdeaStatusEnum}`;
export type IdeaTypeFilter = `${IdeaTypeFilterEnum}`;
export type IdeaStatusFilter = `${IdeaStatusFilterEnum}`;
export type PublishStatusType = `${PublishStatusTypeEnum}`;
export type OnboardingStep = `${OnboardingStepEnum}`;

export interface Idea {
  id: string;
  idea: string;
  description?: string;
  status: IdeaStatus;
  datePosted: string;
  createdAt: string;
  eligibleMedium: boolean;
  eligibleSubstack: boolean;
  eligibleYoutube: boolean;
  eligibleInstagram: boolean;
  ineligibleMedium: boolean;
  ineligibleSubstack: boolean;
  ineligibleYoutube: boolean;
  ineligibleInstagram: boolean;
  publishedMedium: boolean;
  publishedSubstack: boolean;
  publishedYoutube: boolean;
  publishedInstagram: boolean;
  baseArticle: string;
  mediumArticle: string;
  youtubeScript: string;
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
}

/**
 * Flexible checklist fields accepted by status checkers and pipeline evaluators.
 * Compatible with full Idea objects as well as partial updates.
 */
export type IdeaChecklistFields = Partial<Omit<Idea, 'status'>> & {
  status?: string;
};

export interface PublishStatus {
  status: PublishStatusType;
  label: string;
  badgeClass: string;
  dotClass: string;
  borderClass: string;
  bgClass: string;
  accentGradient: string;
}
