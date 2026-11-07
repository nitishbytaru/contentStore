import Link from 'next/link';
import { ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Screenshot } from '@/components/landing/Screenshot';

interface Step {
  title: string;
  body: string;
  detail: string;
  file: string;
  alt: string;
}

const PIPELINE = ['Idea', 'Research', 'Article', 'Script', 'Prompter'] as const;

const STEPS: Step[] = [
  {
    title: 'Add an idea, skip the duplicates',
    body: 'Type a title and click Scan through ideas. ContentStore checks everything you already have and shows the three closest matches.',
    detail: 'If one of them is the same idea, continue with it. If not, continue with a new one.',
    file: 'scan.png',
    alt: 'Create New Idea dialog showing three similar existing ideas',
  },
  {
    title: 'Research from your own sources',
    body: 'Add context by uploading a PDF or pasting notes, then ask the research assistant anything you need to understand the topic.',
    detail: 'Answers come from your document. Not from the internet, and not from assumptions.',
    file: 'research.png',
    alt: 'Research chat answering a question from an uploaded PDF',
  },
  {
    title: 'Generate the article',
    body: 'When your research is done, click Generate article. Your research conversation becomes a full draft.',
    detail: 'The draft is yours to edit, or rewrite with one of your saved prompts.',
    file: 'article.png',
    alt: 'Article tab with a generated draft ready to edit',
  },
  {
    title: 'Store the script, then record',
    body: 'Keep your YouTube or Instagram script on the same idea. When it is time to film, open the Prompter.',
    detail: 'Play and pause, adjust the scroll speed and text size, or mirror the text for a teleprompter rig.',
    file: 'prompter.png',
    alt: 'Full-screen teleprompter scrolling a video script',
  },
];

const TELEGRAM_ASKS = [
  'How many ideas do I have right now?',
  'Name them.',
  'Create a new idea called “data structures”, article only.',
];

function GetStarted({ className }: { className?: string }) {
  return (
    <Button
      size="lg"
      className={className}
      nativeButton={false}
      render={<Link href="/signup" />}
    >
      Get started free
      <ArrowRight data-icon="inline-end" />
    </Button>
  );
}

export function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 pb-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-base sm:text-lg">
          <span className="size-2.5 rounded-full bg-foreground" aria-hidden />
          ContentStore
        </Link>
        <nav className="flex items-center gap-1.5">
          <Button variant="ghost" size="lg" nativeButton={false} render={<Link href="/login" />}>
            Log in
          </Button>
          <GetStarted className="hidden sm:inline-flex" />
        </nav>
      </header>

      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center pt-6 pb-14 md:pt-12 md:pb-20">
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.08] text-balance">
            From idea to article to script, grounded in your own sources.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-[52ch] text-pretty">
            ContentStore keeps every content idea in one place. Research it from your own PDFs and notes,
            generate the article, store the video script, and read it back on a built-in teleprompter.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <GetStarted />
            <Button variant="outline" size="lg" nativeButton={false} render={<Link href="#how-it-works" />}>
              See how it works
            </Button>
          </div>
        </div>
        <Screenshot file="hero.png" alt="An idea page in ContentStore with research, article and video script tabs" priority />
      </section>

      {/* Pipeline */}
      <section aria-label="The ContentStore pipeline" className="border-y border-border py-5">
        <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm sm:text-base">
          {PIPELINE.map((stage, i) => (
            <li key={stage} className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-card px-3 py-1 font-medium">{stage}</span>
              {i < PIPELINE.length - 1 && <ArrowRight className="size-4 text-muted-foreground" aria-hidden />}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-center text-sm text-muted-foreground">One idea, the whole way through. Nothing to copy between tools.</p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 pt-16 md:pt-24">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-balance">How it works</h2>
        <p className="mt-2 text-muted-foreground max-w-[60ch]">Four steps, all on one idea page.</p>

        <ol className="mt-10 flex flex-col gap-14 md:gap-20">
          {STEPS.map((step, i) => (
            <li key={step.title} className="grid gap-6 md:grid-cols-2 md:items-center md:gap-10">
              <div className={i % 2 === 1 ? 'md:order-2' : undefined}>
                <p className="text-sm font-semibold text-highlight tabular-nums">Step {i + 1}</p>
                <h3 className="mt-1.5 text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-balance">{step.title}</h3>
                <p className="mt-3 text-muted-foreground max-w-[56ch] text-pretty">{step.body}</p>
                <p className="mt-3 text-foreground/90 max-w-[56ch] text-pretty">{step.detail}</p>
              </div>
              <Screenshot file={step.file} alt={step.alt} className={i % 2 === 1 ? 'md:order-1' : undefined} />
            </li>
          ))}
        </ol>
      </section>

      {/* Telegram */}
      <section className="mt-20 md:mt-28 grid gap-8 rounded-2xl border border-border bg-card p-5 sm:p-8 md:grid-cols-2 md:items-center md:gap-10">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-semibold tracking-[-0.02em]">
            <Send className="size-6 text-muted-foreground" aria-hidden />
            Your ideas, in your chat
          </h2>
          <p className="mt-3 text-muted-foreground max-w-[54ch] text-pretty">
            Connect Telegram and talk to your ContentStore. Ask what you have, or add a new idea without opening the site.
          </p>
          <ul className="mt-5 flex flex-col gap-2">
            {TELEGRAM_ASKS.map((ask) => (
              <li key={ask} className="w-fit max-w-full rounded-lg rounded-bl-sm border border-border bg-background px-3 py-2 text-sm">
                {ask}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground max-w-[54ch]">
            The bot replies with a link, and the new idea is already waiting on the website.
          </p>
        </div>
        <Screenshot file="telegram.png" alt="Telegram chat with the ContentStore bot listing ideas and creating a new one" />
      </section>

      {/* Closing CTA */}
      <section className="flex flex-col items-center gap-4 py-20 md:py-28 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-balance max-w-[24ch]">
          Start your next idea in ContentStore.
        </h2>
        <p className="text-muted-foreground max-w-[48ch]">Free to sign up. Add your first idea in under a minute.</p>
        <GetStarted />
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
        <span>ContentStore</span>
        <Link href="/login" className="underline-offset-4 hover:text-foreground hover:underline">
          Log in
        </Link>
      </footer>
    </div>
  );
}
