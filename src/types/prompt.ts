export interface PromptItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  /** Onboarding sample prompt created for the product tour. */
  isSample?: boolean;
}

