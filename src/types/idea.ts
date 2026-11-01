import {
  IdeaStatus as IdeaStatusEnum,
  IdeaTypeFilter as IdeaTypeFilterEnum,
  IdeaStatusFilter as IdeaStatusFilterEnum,
  PublishStatusType as PublishStatusTypeEnum,
} from '@/enums';

export {
  IdeaStatusEnum,
  IdeaTypeFilterEnum,
  IdeaStatusFilterEnum,
  PublishStatusTypeEnum,
};

export type IdeaStatus = `${IdeaStatusEnum}`;
export type IdeaTypeFilter = `${IdeaTypeFilterEnum}`;
export type IdeaStatusFilter = `${IdeaStatusFilterEnum}`;
export type PublishStatusType = `${PublishStatusTypeEnum}`;

export interface Idea {
  ideaId: string;
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
  baseArticle: string;
  mediumArticle: string;
  youtubeScript: string;
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
