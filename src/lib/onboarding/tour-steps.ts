/**
 * Steps of the onboarding product tour, grouped into short sections that can be skipped.
 *
 * - `route`: 'ideas' is /ideas, 'editor' is the sample idea's editor page.
 * - `target`: value of a `data-tour` attribute. Missing or hidden targets fall back
 *   to a centred card.
 * - `advance`: 'next' shows a Next button; 'click' waits for a click on the target;
 *   { signal } waits for a component to dispatch tourSignal(signal) after an action succeeds.
 * - `needs`: sample data this step depends on. When the user skips ahead to it, the
 *   tour prepares that data first (see /api/onboarding/sample/prepare).
 */

export type TourRoute = 'ideas' | 'editor';

export type TourSignal =
  | 'source-added'
  | 'answered'
  | 'article-generated'
  | 'prompt-applied'
  | 'prompter-opened'
  | 'prompter-closed';

export type TourNeed = 'context' | 'article';

export type TourSectionId = 'ideas' | 'research' | 'ask' | 'article' | 'video' | 'wrap-up';

export interface TourSection {
  id: TourSectionId;
  title: string;
}

export interface TourStep {
  id: string;
  section: TourSectionId;
  route: TourRoute;
  target?: string;
  title: string;
  body: string;
  advance: 'next' | 'click' | { signal: TourSignal };
  /** Short instruction shown while the tour waits for the user. */
  waitingHint?: string;
  /** Shown with the tracing-border loader while the awaited action runs. */
  busyText?: string;
  needs?: TourNeed;
  /** data-tour id of an editor tab to switch to when this step starts (if not already open). */
  openTab?: 'tab-baseArticle' | 'tab-mediumArticle';
}

export const TOUR_SECTIONS: TourSection[] = [
  { id: 'ideas', title: 'Ideas' },
  { id: 'research', title: 'Research' },
  { id: 'ask', title: 'Ask AI' },
  { id: 'article', title: 'Article' },
  { id: 'video', title: 'Video' },
  { id: 'wrap-up', title: 'Wrap-up' },
];

export const TOUR_STEPS: TourStep[] = [
  // 1. Ideas
  {
    id: 'sample-idea',
    section: 'ideas',
    route: 'ideas',
    target: 'sample-idea',
    title: 'Your first idea',
    body: 'We added a sample so you can try everything.',
    advance: 'next',
  },
  {
    id: 'filters',
    section: 'ideas',
    route: 'ideas',
    target: 'idea-filters',
    title: 'Track progress',
    body: 'Filter ideas by stage and status.',
    advance: 'next',
  },
  {
    id: 'new-idea',
    section: 'ideas',
    route: 'ideas',
    target: 'new-idea',
    title: 'Add your own',
    body: 'Create ideas here. Duplicates get flagged.',
    advance: 'next',
  },
  {
    id: 'open-sample',
    section: 'ideas',
    route: 'ideas',
    target: 'sample-idea-open',
    title: 'Open it',
    body: 'Click the idea to open its workspace.',
    advance: 'click',
    waitingHint: 'Click the idea',
  },

  // 2. Research
  {
    id: 'editor-header',
    section: 'research',
    route: 'editor',
    target: 'editor-title',
    title: 'The workspace',
    body: 'Research, article and script for one idea.',
    advance: 'next',
  },
  {
    id: 'formats',
    section: 'research',
    route: 'editor',
    target: 'editor-formats',
    title: 'Formats',
    body: 'Turn the Article and Video tabs on or off.',
    advance: 'next',
  },
  {
    id: 'add-context',
    section: 'research',
    route: 'editor',
    target: 'research-add-context',
    title: 'Add research',
    body: 'Give the AI something to read.',
    advance: 'click',
    waitingHint: 'Click "Add context"',
  },
  {
    id: 'upload-text',
    section: 'research',
    route: 'editor',
    target: 'research-upload-text',
    title: 'Paste or upload',
    body: 'Add a PDF or paste notes.',
    advance: 'click',
    waitingHint: 'Click "Upload text"',
  },
  {
    id: 'sample-notes',
    section: 'research',
    route: 'editor',
    target: 'research-sample-notes',
    title: 'Use our notes',
    body: 'We prepared research notes for you.',
    advance: 'click',
    waitingHint: 'Click "Use sample notes"',
  },
  {
    id: 'add-text',
    section: 'research',
    route: 'editor',
    target: 'research-add-text',
    title: 'Save them',
    body: 'The AI indexes your notes for search.',
    advance: { signal: 'source-added' },
    waitingHint: 'Click "Add text"',
    busyText: 'Reading your notes…',
  },

  // 3. Ask AI
  {
    id: 'suggestions',
    section: 'ask',
    route: 'editor',
    target: 'research-suggestions',
    title: 'Ask a question',
    body: 'Pick a suggested question.',
    advance: 'click',
    waitingHint: 'Click a question',
    needs: 'context',
    openTab: 'tab-baseArticle',
  },
  {
    id: 'ask',
    section: 'ask',
    route: 'editor',
    target: 'research-ask',
    title: 'Send it',
    body: 'Answers come only from your notes.',
    advance: { signal: 'answered' },
    waitingHint: 'Click "Ask"',
    busyText: 'Finding the answer…',
    needs: 'context',
    openTab: 'tab-baseArticle',
  },
  {
    id: 'generate',
    section: 'ask',
    route: 'editor',
    target: 'research-generate',
    title: 'Write the article',
    body: 'Turn the chat into a full draft.',
    advance: { signal: 'article-generated' },
    waitingHint: 'Click "Generate article"',
    busyText: 'Writing your article…',
    needs: 'context',
    openTab: 'tab-baseArticle',
  },

  // 4. Article
  {
    id: 'article',
    section: 'article',
    route: 'editor',
    target: 'article-editor',
    title: 'Your draft',
    body: 'Edit freely, then press Save.',
    advance: 'next',
    needs: 'article',
    openTab: 'tab-mediumArticle',
  },
  {
    id: 'use-prompt',
    section: 'article',
    route: 'editor',
    target: 'article-use-prompt',
    title: 'Rewrite with a prompt',
    body: 'Prompts are reusable writing styles.',
    advance: 'click',
    waitingHint: 'Click "Use a prompt"',
    needs: 'article',
    openTab: 'tab-mediumArticle',
  },
  {
    id: 'pick-prompt',
    section: 'article',
    route: 'editor',
    target: 'prompt-sample',
    title: 'Pick one',
    body: 'Choose "Punchy hook-first rewrite".',
    advance: 'click',
    waitingHint: 'Select the highlighted prompt',
    needs: 'article',
  },
  {
    id: 'apply-prompt',
    section: 'article',
    route: 'editor',
    target: 'prompt-apply',
    title: 'Apply it',
    body: 'The AI rewrites your draft in that style.',
    advance: { signal: 'prompt-applied' },
    waitingHint: 'Click "Rewrite Article"',
    busyText: 'Rewriting your article…',
    needs: 'article',
  },

  // 5. Video
  {
    id: 'video-tab',
    section: 'video',
    route: 'editor',
    target: 'tab-youtubeScript',
    title: 'Video script',
    body: 'Same idea, ready for YouTube or Reels.',
    advance: 'click',
    waitingHint: 'Click "Video Script"',
  },
  {
    id: 'open-prompter',
    section: 'video',
    route: 'editor',
    target: 'open-prompter',
    title: 'Teleprompter',
    body: 'Read your script full screen.',
    advance: { signal: 'prompter-opened' },
    waitingHint: 'Click "Prompter"',
  },
  {
    id: 'prompter-play',
    section: 'video',
    route: 'editor',
    target: 'prompter-play',
    title: 'Play',
    body: 'Auto-scrolls. Space plays or pauses.',
    advance: 'next',
  },
  {
    id: 'prompter-exit',
    section: 'video',
    route: 'editor',
    target: 'prompter-exit',
    title: 'Exit',
    body: 'Press Esc or "Exit Prompter".',
    advance: { signal: 'prompter-closed' },
    waitingHint: 'Exit the prompter',
  },
  {
    id: 'complete',
    section: 'video',
    route: 'editor',
    target: 'editor-complete',
    title: 'Complete it',
    body: 'Mark the idea done once published.',
    advance: 'next',
  },

  // 6. Wrap-up
  {
    id: 'nav-prompts',
    section: 'wrap-up',
    route: 'ideas',
    target: 'nav-prompts',
    title: 'Prompt library',
    body: 'Your saved writing styles live here.',
    advance: 'next',
  },
  {
    id: 'nav-telegram',
    section: 'wrap-up',
    route: 'ideas',
    target: 'nav-telegram',
    title: 'Telegram',
    body: 'Capture ideas from your phone.',
    advance: 'next',
  },
  {
    id: 'finish',
    section: 'wrap-up',
    route: 'ideas',
    title: "You're all set!",
    body: 'Keep the sample (gone in 2 days) or start fresh.',
    advance: 'next',
  },
];

/** Index of the first step of the next section, or -1 if this is the last section. */
export function nextSectionStart(stepIndex: number): number {
  const section = TOUR_STEPS[stepIndex]?.section;
  return TOUR_STEPS.findIndex((step, i) => i > stepIndex && step.section !== section);
}

/** Where a step sits: its section, and its position inside that section. */
export function stepPosition(stepIndex: number) {
  const step = TOUR_STEPS[stepIndex];
  const sectionIndex = TOUR_SECTIONS.findIndex((section) => section.id === step?.section);
  const inSection = TOUR_STEPS.filter((s) => s.section === step?.section);
  return {
    sectionIndex,
    sectionTitle: TOUR_SECTIONS[sectionIndex]?.title ?? '',
    step: inSection.findIndex((s) => s.id === step?.id) + 1,
    stepCount: inSection.length,
    isLastInSection: inSection[inSection.length - 1]?.id === step?.id,
  };
}

/** Bumped when the step list changes, so progress saved by an older tour is not resumed. */
export const TOUR_STORAGE_KEY = 'contentstore-tour-v2';
