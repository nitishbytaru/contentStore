/**
 * Steps of the onboarding product tour.
 *
 * - `route`: 'ideas' is /ideas, 'editor' is the sample idea's editor page.
 * - `target`: value of a `data-tour` attribute. Missing or hidden targets fall back
 *   to a centred card.
 * - `advance`: 'next' shows a Next button; 'click' waits for a click on the target;
 *   { signal } waits for a component to dispatch tourSignal(signal) after an action succeeds.
 */

export type TourRoute = 'ideas' | 'editor';

export type TourSignal =
  | 'source-added'
  | 'answered'
  | 'article-generated'
  | 'prompt-applied'
  | 'prompter-opened'
  | 'prompter-closed';

export interface TourStep {
  id: string;
  route: TourRoute;
  target?: string;
  title: string;
  body: string;
  advance: 'next' | 'click' | { signal: TourSignal };
  /** Hint shown under the body while the tour waits for the user. */
  waitingHint?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'sample-idea',
    route: 'ideas',
    target: 'sample-idea',
    title: 'Meet your first idea',
    body: 'Every piece of content starts as an idea. We added one for you so you can try the whole flow without writing anything yourself.',
    advance: 'next',
  },
  {
    id: 'filters',
    route: 'ideas',
    target: 'idea-filters',
    title: 'Track every stage',
    body: 'Filter ideas by stage (research, article, video) and switch between pending and completed work.',
    advance: 'next',
  },
  {
    id: 'new-idea',
    route: 'ideas',
    target: 'new-idea',
    title: 'Add your own ideas here',
    body: 'When you add a new idea, ContentStore checks your existing ideas first so you never write the same thing twice. We will come back to this at the end.',
    advance: 'next',
  },
  {
    id: 'open-sample',
    route: 'ideas',
    target: 'sample-idea-open',
    title: 'Open the idea',
    body: 'Click the idea title to open its workspace.',
    advance: 'click',
    waitingHint: 'Click the highlighted title',
  },
  {
    id: 'editor-header',
    route: 'editor',
    target: 'editor-title',
    title: 'The idea workspace',
    body: 'Everything for one idea lives here: research, the article draft and the video script. The badges show its current stage.',
    advance: 'next',
  },
  {
    id: 'formats',
    route: 'editor',
    target: 'editor-formats',
    title: 'Pick your formats',
    body: 'Use this button to turn the Article and Video Script tabs on or off for an idea.',
    advance: 'next',
  },
  {
    id: 'research-chat',
    route: 'editor',
    target: 'research-chat',
    title: 'Your research assistant',
    body: 'Add PDFs or notes as context, then ask questions. The assistant answers only from the sources you add.',
    advance: 'next',
  },
  {
    id: 'add-context',
    route: 'editor',
    target: 'research-add-context',
    title: 'Add some context',
    body: 'Click "Add context" to give the assistant something to research.',
    advance: 'click',
    waitingHint: 'Click "Add context"',
  },
  {
    id: 'upload-text',
    route: 'editor',
    target: 'research-upload-text',
    title: 'Paste notes or upload a PDF',
    body: 'You can upload a PDF or paste text. Let\'s paste some notes. Click "Upload text".',
    advance: 'click',
    waitingHint: 'Click "Upload text"',
  },
  {
    id: 'sample-notes',
    route: 'editor',
    target: 'research-sample-notes',
    title: 'Use our sample notes',
    body: 'We prepared research notes on the 2-minute rule. Click "Use sample notes" to fill them in.',
    advance: 'click',
    waitingHint: 'Click "Use sample notes"',
  },
  {
    id: 'add-text',
    route: 'editor',
    target: 'research-add-text',
    title: 'Save the context',
    body: 'Click "Add text". The notes are split into sections and indexed so the assistant can search them.',
    advance: { signal: 'source-added' },
    waitingHint: 'Click "Add text" and wait for it to finish',
  },
  {
    id: 'suggestions',
    route: 'editor',
    target: 'research-suggestions',
    title: 'Ask a question',
    body: 'Pick one of these questions to put it in the message box.',
    advance: 'click',
    waitingHint: 'Click a question',
  },
  {
    id: 'ask',
    route: 'editor',
    target: 'research-ask',
    title: 'Send it',
    body: 'Press "Ask". The assistant searches your notes and answers from them.',
    advance: { signal: 'answered' },
    waitingHint: 'Press "Ask" and wait for the answer',
  },
  {
    id: 'generate',
    route: 'editor',
    target: 'research-generate',
    title: 'Turn research into an article',
    body: 'Ask as many questions as you like. When you are ready, "Generate article" writes a full draft from the conversation. Try it now.',
    advance: { signal: 'article-generated' },
    waitingHint: 'Click "Generate article" and wait for the draft',
  },
  {
    id: 'article',
    route: 'editor',
    target: 'article-editor',
    title: 'Your article draft',
    body: 'The draft is saved to the Article tab. Edit it freely, then press Save.',
    advance: 'next',
  },
  {
    id: 'use-prompt',
    route: 'editor',
    target: 'article-use-prompt',
    title: 'Rewrite it with a prompt',
    body: 'Prompts are reusable writing instructions, for example a tone, structure or audience. Click "Use a prompt".',
    advance: 'click',
    waitingHint: 'Click "Use a prompt"',
  },
  {
    id: 'pick-prompt',
    route: 'editor',
    target: 'prompt-sample',
    title: 'Choose a prompt',
    body: 'Select "Punchy hook-first rewrite". We added it to your prompt library for you.',
    advance: 'click',
    waitingHint: 'Select the highlighted prompt',
  },
  {
    id: 'apply-prompt',
    route: 'editor',
    target: 'prompt-apply',
    title: 'Rewrite the article',
    body: 'Click "Rewrite Article" to apply the prompt to your draft.',
    advance: { signal: 'prompt-applied' },
    waitingHint: 'Click "Rewrite Article" and wait',
  },
  {
    id: 'video-tab',
    route: 'editor',
    target: 'tab-youtubeScript',
    title: 'Now the video',
    body: 'The same idea can become a YouTube or Instagram video. Open the Video Script tab.',
    advance: 'click',
    waitingHint: 'Click "Video Script"',
  },
  {
    id: 'open-prompter',
    route: 'editor',
    target: 'open-prompter',
    title: 'Record with the teleprompter',
    body: 'We drafted a script for this idea. Click "Prompter" to read it full screen while you record.',
    advance: { signal: 'prompter-opened' },
    waitingHint: 'Click "Prompter"',
  },
  {
    id: 'prompter-play',
    route: 'editor',
    target: 'prompter-play',
    title: 'Hands-free reading',
    body: 'Press Play (or Space) to auto-scroll. You can change the speed and text size, and mirror the text for teleprompter glass.',
    advance: 'next',
  },
  {
    id: 'prompter-exit',
    route: 'editor',
    target: 'prompter-exit',
    title: 'Close the prompter',
    body: 'Click "Exit Prompter" or press Esc to return to the workspace.',
    advance: { signal: 'prompter-closed' },
    waitingHint: 'Exit the prompter',
  },
  {
    id: 'complete',
    route: 'editor',
    target: 'editor-complete',
    title: 'Mark it complete',
    body: 'When the article and video are published, press Complete. The idea moves to your completed list and counts in Analytics.',
    advance: 'next',
  },
  {
    id: 'nav-prompts',
    route: 'ideas',
    target: 'nav-prompts',
    title: 'Your prompt library',
    body: 'Create, edit and enhance your writing prompts here. The sample prompt you just used is already there.',
    advance: 'next',
  },
  {
    id: 'nav-telegram',
    route: 'ideas',
    target: 'nav-telegram',
    title: 'Capture ideas on the go',
    body: 'Connect Telegram to save new ideas or check your pipeline by chatting with the ContentStore bot.',
    advance: 'next',
  },
  {
    id: 'finish',
    route: 'ideas',
    title: "You're all set!",
    body: 'That is the whole flow: idea, research, article, video. The sample idea stays for 2 days unless you edit it. Delete it now or keep exploring, then add your own idea.',
    advance: 'next',
  },
];

export const TOUR_STORAGE_KEY = 'contentstore-tour';
