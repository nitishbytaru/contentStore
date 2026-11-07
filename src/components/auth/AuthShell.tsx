import Link from 'next/link';
import { BookOpen, Clapperboard, FileText, Lightbulb, MonitorPlay, type LucideIcon } from 'lucide-react';

interface Stage {
  icon: LucideIcon;
  name: string;
  line: string;
}

const STAGES: Stage[] = [
  { icon: Lightbulb, name: 'Idea', line: 'Scan your library so you never repeat yourself.' },
  { icon: BookOpen, name: 'Research', line: 'Ask questions answered from your own PDFs and notes.' },
  { icon: FileText, name: 'Article', line: 'Turn the research chat into a draft in one click.' },
  { icon: Clapperboard, name: 'Script', line: 'Keep the video script on the same idea.' },
  { icon: MonitorPlay, name: 'Prompter', line: 'Read it back full-screen while you record.' },
];

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/** Shared frame for /login and /signup: pipeline story on the left, form on the right. */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="grid gap-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 lg:items-stretch">
      {/* Story panel */}
      <aside className="relative flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-6 lg:p-10">
        <Link href="/" className="flex w-fit items-center gap-2 font-semibold tracking-tight text-base sm:text-lg">
          <span className="size-2.5 rounded-full bg-primary" aria-hidden />
          ContentStore
        </Link>

        <p className="mt-3 text-sm text-muted-foreground lg:hidden">
          Idea → Research → Article → Script → Prompter, all on one page.
        </p>

        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:py-10">
          <p className="text-2xl xl:text-3xl font-semibold tracking-[-0.02em] leading-tight text-balance max-w-[22ch]">
            One idea, carried all the way to camera.
          </p>

          <ol className="relative mt-10 flex flex-col gap-6">
            {/* Track the dot travels down */}
            <span className="absolute left-[15px] top-4 bottom-4 w-px bg-border" aria-hidden>
              <span
                data-auth-trace
                className="absolute -left-[3px] size-[7px] rounded-full bg-highlight shadow-[0_0_10px_2px_rgb(191_0_255/0.55)]"
              />
            </span>
            {STAGES.map(({ icon: Icon, name, line }) => (
              <li key={name} className="relative flex items-start gap-4">
                <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                  <Icon className="size-4 text-foreground" aria-hidden />
                </span>
                <div className="pt-1">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-sm text-muted-foreground">{line}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="hidden lg:block text-xs text-muted-foreground">
          Research answers come from your sources. Not the internet, not assumptions.
        </p>
      </aside>

      {/* Form */}
      <section className="flex items-center justify-center pb-6 lg:py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
      </section>
    </div>
  );
}
