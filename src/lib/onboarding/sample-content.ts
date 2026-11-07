/**
 * Content for the onboarding sample idea used by the product tour.
 *
 * The AI steps on the sample idea (research answers, Generate Article and the
 * sample prompt rewrite) return this pre-written text after a realistic delay
 * instead of calling Groq. Keep every answer grounded in SAMPLE_CONTEXT so it
 * reads exactly like the real research assistant would.
 */

export const SAMPLE_IDEA = {
  title: 'Why the 2-minute rule beats motivation',
  description:
    'Explain why waiting to feel motivated fails, and how shrinking a habit to a two-minute version gets people started and keeps them going.',
};

export const SAMPLE_SOURCE_TITLE = 'Research notes: the 2-minute rule';

export const SAMPLE_CONTEXT = `Research notes: the 2-minute rule and why motivation is unreliable

Motivation is a feeling, and feelings change from hour to hour. Most people wait to feel motivated before they start a task, but motivation usually shows up after we begin, not before. Psychologists call this pattern "action before motivation": once a task is underway, the brain starts to treat it as something already in progress and resists stopping.

The 2-minute rule says: when you start a new habit, scale it down until it takes less than two minutes to do. "Read before bed" becomes "read one page". "Do thirty minutes of yoga" becomes "roll out the yoga mat". "Study for class" becomes "open my notes". "Run three miles" becomes "put on my running shoes". The goal is not to stop at two minutes forever. The goal is to make starting so easy that you cannot say no to it.

Why it works, point 1: friction. The hardest part of most habits is the first step. A tiny version removes almost all friction, so the habit no longer depends on willpower or mood.

Why it works, point 2: identity. Every time you show up, even for two minutes, you cast a vote for the kind of person you want to be. Someone who puts on running shoes every day is becoming "a runner", even before the runs get long. Small repetitions build the identity first, and the bigger behaviour follows the identity.

Why it works, point 3: the Zeigarnik effect. People remember and feel pulled toward unfinished tasks more than finished ones. Starting a task for two minutes leaves it open in the mind, which makes it more likely you will keep going or come back to it.

Common mistakes: making the two-minute version still too big ("write 500 words" is not two minutes); judging yourself for stopping after two minutes; and skipping days because the tiny version feels pointless. Consistency matters more than size in the first weeks. A common guideline is "never miss twice": missing one day is an accident, missing two days starts a new habit of not doing it.

How to scale up: once the two-minute habit is automatic, usually after two to four weeks of showing up, extend it gradually. Add a few minutes at a time, or add the next step of the routine. The habit should feel almost too easy at each stage.

A creator example: a writer who struggled to publish set the rule "open the draft and write one sentence every morning". Most days one sentence turned into a paragraph or more. Within two months she had a weekly publishing routine, not because she found more motivation, but because starting stopped being a decision.

Key takeaway: do not wait for motivation. Design a start that is too small to fail, show up every day, and let momentum and identity do the rest.`;

export interface SampleQa {
  question: string;
  answer: string;
}

export const SAMPLE_QA: SampleQa[] = [
  {
    question: 'What is the 2-minute rule?',
    answer:
      'The 2-minute rule says that when you start a new habit, you scale it down until it takes less than two minutes. Reading before bed becomes reading one page, thirty minutes of yoga becomes rolling out the mat, and running three miles becomes putting on your running shoes. The point is not to stop at two minutes forever. It is to make starting so easy that you cannot say no, so the habit no longer depends on feeling motivated.',
  },
  {
    question: 'Why does motivation fail us?',
    answer:
      'Motivation is a feeling, and feelings change from hour to hour, so it is an unreliable trigger. Most people wait to feel motivated before they start, but motivation usually shows up after you begin. Once a task is underway, the brain treats it as something already in progress and resists stopping. That is why designing an easy start works better than waiting for the right mood.',
  },
  {
    question: 'What are the common mistakes and how do I scale up?',
    answer:
      'The notes list three common mistakes: making the two-minute version still too big, judging yourself for stopping after two minutes, and skipping days because the tiny version feels pointless. In the first weeks consistency matters more than size, and a useful guideline is never miss twice. Once the tiny habit feels automatic, usually after two to four weeks, extend it gradually by adding a few minutes or the next step of the routine, so each stage still feels almost too easy.',
  },
];

export const SAMPLE_ARTICLE = `Why the 2-minute rule beats motivation

Most of us treat motivation as the starting gun. We wait until we feel ready, inspired or energised, and only then do we begin. The problem is that motivation is a feeling, and feelings change from hour to hour. If a habit depends on how you feel, it will only happen on the days you happen to feel good.

The surprising part is that motivation usually arrives after we start, not before. Once a task is underway, the brain begins to treat it as something already in progress and resists stopping. The real challenge, then, is not finding motivation. It is getting started.

That is exactly what the 2-minute rule is built for. When you start a new habit, you shrink it until it takes less than two minutes. Read before bed becomes read one page. Thirty minutes of yoga becomes rolling out the mat. Running three miles becomes putting on your running shoes. The goal is not to stay at two minutes forever, but to make starting so easy that you cannot say no.

It works for three reasons. First, it removes friction. The hardest part of most habits is the first step, and a tiny version takes away almost all of it, so the habit no longer relies on willpower or mood. Second, it builds identity. Every time you show up, even briefly, you cast a vote for the kind of person you want to become, and the bigger behaviour follows that identity. Third, an unfinished task stays open in the mind and keeps pulling at you, which makes it more likely you will keep going or come back to it.

There are a few traps to avoid. A two-minute version that is really twenty minutes is not a two-minute version. Stopping after two minutes is not a failure, it is the plan. And skipping days because the tiny version feels pointless misses the point: in the first weeks, consistency matters far more than size. If you miss a day, make sure you never miss twice.

Once the small habit becomes automatic, usually after two to four weeks, you can scale it up gradually by adding a few minutes or the next step of the routine. Each stage should still feel almost too easy.

One writer who struggled to publish set a simple rule: open the draft and write one sentence every morning. Most days that sentence became a paragraph or more, and within two months she had a weekly publishing routine. She did not find more motivation. Starting simply stopped being a decision.

So stop waiting to feel ready. Design a start that is too small to fail, show up every day, and let momentum and identity do the rest.`;

export const SAMPLE_PROMPT = {
  title: 'Punchy hook-first rewrite',
  content:
    'Rewrite this article so it opens with a bold, surprising hook in the first line. Use short paragraphs of one to three sentences, a confident conversational tone, and concrete examples. Cut filler words, keep every fact from the draft, and end with one clear call to action.',
};

export const SAMPLE_REWRITTEN_ARTICLE = `You don't need more motivation. You need a smaller start.

Here's the truth most productivity advice skips: motivation is a feeling. And feelings change by the hour.

If your habit only happens when you feel ready, it only happens on your good days.

Now the twist. Motivation usually shows up after you start, not before. Once you're moving, your brain treats the task as already in progress and resists quitting.

So the real problem isn't motivation. It's starting.

Enter the 2-minute rule. Shrink any new habit until it takes less than two minutes.

Read before bed? Read one page.
Thirty minutes of yoga? Roll out the mat.
Run three miles? Put on your running shoes.

You're not stopping at two minutes forever. You're making the start so easy you can't say no.

Why it works:

Friction disappears. The first step is the hardest, and a tiny version removes almost all of it. No willpower required.

Identity grows. Every time you show up, you cast a vote for who you want to become. Bigger behaviour follows.

Open loops pull you back. An unfinished task stays on your mind, so you're more likely to keep going.

Avoid three traps. A "two-minute" habit that really takes twenty. Feeling guilty for stopping at two minutes. Skipping days because it feels too small. Early on, consistency beats size. Miss a day? Never miss twice.

After two to four weeks, when it feels automatic, level up. Add a few minutes or the next step. Keep every stage almost too easy.

One writer's rule: open the draft and write one sentence every morning. One sentence became paragraphs. Two months later she was publishing weekly. Not more motivation. Just no more deciding.

Your move: pick one habit today, shrink it to two minutes, and do it before tonight.`;

export const SAMPLE_SCRIPT = `Hook: You don't have a motivation problem. You have a starting problem. Give me sixty seconds and I'll show you the fix.

Here's the thing nobody tells you. Motivation is a feeling, and feelings change every hour. If you wait to feel ready, you'll only show up on your good days.

But motivation actually shows up after you start. Once you're moving, your brain wants to keep going.

So use the 2-minute rule. Shrink any habit until it takes less than two minutes. Want to read more? Read one page. Want to run? Just put on your shoes.

It works because it kills friction, it builds your identity one tiny vote at a time, and an unfinished task keeps pulling you back.

Two rules to make it stick. Stopping at two minutes is not failing, it's the plan. And never miss twice.

After a few weeks, when it feels automatic, add a little more. Keep every step almost too easy.

Call to action: Pick one habit right now, shrink it to two minutes, and do it today. Follow for more ways to actually get started.`;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Returns the scripted Q&A for a question, if it is one of the sample questions. */
export function findSampleAnswer(question: string): SampleQa | null {
  const key = normalize(question);
  return SAMPLE_QA.find((qa) => normalize(qa.question) === key) || null;
}

export function isSampleContext(text: string): boolean {
  return normalize(text) === normalize(SAMPLE_CONTEXT);
}

export function isSamplePrompt(prompt: string): boolean {
  return normalize(prompt) === normalize(SAMPLE_PROMPT.content);
}

/** Server-side wait so simulated AI steps feel like a real model call. */
export function simulateLatency(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.round(minMs + Math.random() * (maxMs - minMs));
  return new Promise((resolve) => setTimeout(resolve, ms));
}
