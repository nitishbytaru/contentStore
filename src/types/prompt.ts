export interface PromptItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreatePromptInput = Omit<PromptItem, 'id' | 'createdAt' | 'updatedAt'>;
