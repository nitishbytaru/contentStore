'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Compass, PartyPopper, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/hooks/useOnboarding';
import { TOUR_STEPS, TOUR_STORAGE_KEY, TourStep } from '@/lib/onboarding/tour-steps';
import { useDeleteIdeaMutation } from '@/store/api/ideasApi';
import { hydrateTour, nextStep, prevStep } from '@/store/slices/tourSlice';
import type { AppDispatch, RootState } from '@/store';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;
const CARD_GAP = 12;
const CARD_MAX_WIDTH = 360;
/** Below this width the card becomes a full-width sheet pinned to the top or bottom edge. */
const MOBILE_BREAKPOINT = 640;
const EDGE = 12;
/** How long to wait for a target before showing the step as a centred card. */
const TARGET_TIMEOUT_MS = 1500;

function stepPath(step: TourStep, sampleIdeaId: string | null) {
  return step.route === 'ideas' ? '/ideas' : `/ideas/${sampleIdeaId}`;
}

function findTarget(target: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

function sameRect(a: Rect | null, b: Rect | null) {
  if (!a || !b) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

/**
 * Interactive onboarding tour: spotlights one element at a time and walks the user
 * through the sample idea. Rendered outside #app-shell so BlockingOverlay never makes it inert.
 * The dimming layer ignores pointer events, so the real UI stays usable underneath.
 */
export function TourOverlay() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { active, stepIndex, sampleIdeaId, hydrated } = useSelector((state: RootState) => state.tour);
  const { completeOnboarding, skipTour, skipping } = useOnboarding();
  const [deleteIdea, { isLoading: deleting }] = useDeleteIdeaMutation();

  // Measurements are tagged with the step (and page) they belong to, so a new step
  // starts clean without resetting state inside an effect.
  const [measured, setMeasured] = useState<{ key: string; rect: Rect | null; timedOut: boolean } | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [cardHeight, setCardHeight] = useState(0);
  const [pausedKey, setPausedKey] = useState<string | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const autoNavigate = useRef(false);

  const step = active ? TOUR_STEPS[stepIndex] : undefined;
  const expectedPath = step ? stepPath(step, sampleIdeaId) : null;
  const onRoute = Boolean(expectedPath && pathname === expectedPath);
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const stepKey = `${stepIndex}:${pathname}`;
  const current = measured?.key === stepKey ? measured : null;
  const rect = current?.rect ?? null;
  const timedOut = !step?.target || Boolean(current?.timedOut);
  const showPaused = pausedKey === stepKey;

  // Keeps the card's height current for placement above/below the target.
  const cardRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    const observer = new ResizeObserver(() => setCardHeight(node.offsetHeight));
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // Restore saved progress once, then keep it in localStorage so a reload resumes the tour.
  useEffect(() => {
    let saved = null;
    try {
      const raw = window.localStorage.getItem(TOUR_STORAGE_KEY);
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      saved = null;
    }
    dispatch(hydrateTour(saved));
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (active) {
        window.localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({ active, stepIndex, sampleIdeaId }));
      } else {
        window.localStorage.removeItem(TOUR_STORAGE_KEY);
      }
    } catch {
      // Storage can be unavailable (private mode); the tour still works for this visit.
    }
  }, [active, stepIndex, sampleIdeaId, hydrated]);

  // Next/Back across pages navigates for the user. Leaving the page on their own does not.
  useEffect(() => {
    if (!active || !expectedPath || onRoute || !autoNavigate.current) return;
    autoNavigate.current = false;
    router.push(expectedPath);
  }, [active, expectedPath, onRoute, router]);

  // Only show the "paused" pill if the user stays off the tour's page (not during a tour navigation).
  useEffect(() => {
    if (!active || onRoute) return;
    const timer = window.setTimeout(() => setPausedKey(stepKey), 1200);
    return () => window.clearTimeout(timer);
  }, [active, onRoute, stepKey]);

  // Track the target element's position.
  useEffect(() => {
    if (!step?.target || !onRoute) return;

    const target = step.target;
    const key = stepKey;
    let scrolled = false;
    const started = Date.now();

    const measure = () => {
      setViewport((prev) =>
        prev.width === window.innerWidth && prev.height === window.innerHeight
          ? prev
          : { width: window.innerWidth, height: window.innerHeight }
      );
      const el = findTarget(target);
      if (!el) {
        const late = Date.now() - started > TARGET_TIMEOUT_MS;
        setMeasured((prev) =>
          prev?.key === key && prev.rect === null && prev.timedOut === late ? prev : { key, rect: null, timedOut: late }
        );
        return;
      }
      if (!scrolled) {
        scrolled = true;
        const r = el.getBoundingClientRect();
        if (r.top < 64 || r.bottom > window.innerHeight - 24) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
      const r = el.getBoundingClientRect();
      const next = { top: r.top, left: r.left, width: r.width, height: r.height };
      setMeasured((prev) =>
        prev?.key === key && sameRect(prev.rect, next) ? prev : { key, rect: next, timedOut: false }
      );
    };

    const first = window.requestAnimationFrame(measure);
    const interval = window.setInterval(measure, 200);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.cancelAnimationFrame(first);
      window.clearInterval(interval);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, onRoute, stepKey]);

  // 'click' steps advance when the user clicks the highlighted element.
  useEffect(() => {
    if (!step || !onRoute || step.advance !== 'click' || !step.target) return;
    const selector = `[data-tour="${step.target}"]`;
    const onClick = (event: MouseEvent) => {
      const el = event.target instanceof Element ? event.target.closest(selector) : null;
      if (el) dispatch(nextStep());
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [step, onRoute, dispatch]);

  const goNext = useCallback(() => {
    const next = TOUR_STEPS[stepIndex + 1];
    if (next && stepPath(next, sampleIdeaId) !== pathname) autoNavigate.current = true;
    dispatch(nextStep());
  }, [dispatch, stepIndex, sampleIdeaId, pathname]);

  const goBack = useCallback(() => {
    const prev = TOUR_STEPS[stepIndex - 1];
    if (prev && stepPath(prev, sampleIdeaId) !== pathname) autoNavigate.current = true;
    dispatch(prevStep());
  }, [dispatch, stepIndex, sampleIdeaId, pathname]);

  const finish = useCallback(
    async (then?: 'new-idea' | 'delete-sample') => {
      if (then === 'delete-sample' && sampleIdeaId) {
        try {
          await deleteIdea(sampleIdeaId).unwrap();
          toast.success('Sample idea deleted');
        } catch {
          toast.error('Could not delete the sample idea');
          return;
        }
      }
      await completeOnboarding();
      if (then === 'new-idea') router.push('/ideas/new');
      else if (then === 'delete-sample') router.push('/ideas');
      else toast.success('Tour complete. Happy creating!');
    },
    [sampleIdeaId, deleteIdea, completeOnboarding, router]
  );

  if (!hydrated || !active || !step) return null;

  // Off the tour's page: offer a way back instead of covering an unrelated screen.
  if (!onRoute) {
    if (!showPaused) return null;
    return (
      <Card
        size="sm"
        className="fixed inset-x-3 bottom-3 z-[150] flex-row items-center gap-2 px-3 shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 sm:inset-x-auto sm:left-4 sm:bottom-4"
      >
        <Compass className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">Tour paused</span>
        <Button size="sm" onClick={() => expectedPath && router.push(expectedPath)}>
          Resume
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          title="Skip the tour and remove the sample data"
          disabled={skipping}
          onClick={() => void skipTour()}
        >
          <X />
          Skip tour
        </Button>
      </Card>
    );
  }

  const waiting = step.advance !== 'next';
  // Show nothing for a moment while the target loads, to avoid a centred-card flash.
  if (!rect && !timedOut) return null;

  const vw = viewport.width || (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const vh = viewport.height || (typeof window !== 'undefined' ? window.innerHeight : 768);
  const isMobile = vw < MOBILE_BREAKPOINT;
  const estimatedHeight = cardHeight || 220;

  // Placement. Phones: full-width sheet on the edge away from the target.
  // Larger screens: below the target, else above, else pinned to the bottom centre.
  let cardStyle: React.CSSProperties;
  if (isMobile) {
    const targetInLowerHalf = rect ? rect.top + rect.height / 2 > vh / 2 : false;
    cardStyle = targetInLowerHalf ? { left: EDGE, right: EDGE, top: EDGE } : { left: EDGE, right: EDGE, bottom: EDGE };
  } else {
    const cardWidth = Math.min(CARD_MAX_WIDTH, vw - EDGE * 2);
    if (!rect) {
      cardStyle = { left: (vw - cardWidth) / 2, top: Math.max(EDGE, (vh - estimatedHeight) / 2), width: cardWidth };
    } else {
      const left = Math.min(Math.max(EDGE, rect.left), vw - cardWidth - EDGE);
      const below = rect.top + rect.height + PAD + CARD_GAP;
      const above = rect.top - PAD - CARD_GAP - estimatedHeight;
      if (below + estimatedHeight <= vh - EDGE) cardStyle = { left, top: below, width: cardWidth };
      else if (above >= EDGE) cardStyle = { left, top: above, width: cardWidth };
      else cardStyle = { left: (vw - cardWidth) / 2, bottom: EDGE, width: cardWidth };
    }
  }

  const prev = TOUR_STEPS[stepIndex - 1];
  const canGoBack = Boolean(prev && prev.advance === 'next' && !waiting);
  const progress = ((stepIndex + 1) / TOUR_STEPS.length) * 100;

  return (
    <>
      {/* Dimming layer with a spotlight hole; never blocks clicks. */}
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[150] rounded-lg ring-2 ring-primary transition-all duration-200 ease-out"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
          }}
        >
          {waiting && <span className="absolute inset-0 rounded-lg ring-2 ring-primary/60 animate-ping" />}
        </div>
      ) : (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[150] bg-black/50" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={cardRef}
          role="dialog"
          aria-label={step.title}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="fixed z-[151]"
          style={cardStyle}
        >
          <Card size="sm" className="max-h-[calc(100dvh-24px)] overflow-y-auto shadow-2xl">
            <CardHeader>
              <Badge variant="secondary" className="w-fit text-[10px] font-medium">
                Step {stepIndex + 1} of {TOUR_STEPS.length}
              </Badge>
              <CardTitle className="mt-1 flex items-center gap-1.5">
                {isLast && <PartyPopper className="h-4 w-4 shrink-0 text-primary" />}
                {step.title}
              </CardTitle>
              {!isLast && (
                <CardAction>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-muted-foreground"
                    title="Skip the tour and remove the sample data"
                    disabled={skipping}
                    onClick={() => void skipTour()}
                  >
                    Skip tour
                    <X data-icon="inline-end" />
                  </Button>
                </CardAction>
              )}
              <CardDescription className="text-xs leading-relaxed">{step.body}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {waiting && step.waitingHint && (
                <Badge variant="outline" className="h-auto max-w-full gap-2 whitespace-normal border-primary/30 py-1 text-[11px] font-medium text-primary">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {step.waitingHint}
                </Badge>
              )}
              <Progress value={progress} aria-label="Tour progress" />
            </CardContent>

            {isLast ? (
              <CardFooter className="flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={deleting}
                  onClick={() => void finish('delete-sample')}
                >
                  <Trash2 data-icon="inline-start" />
                  Delete sample
                </Button>
                <Button size="sm" variant="outline" onClick={() => void finish()}>
                  Done
                </Button>
                <Button size="sm" onClick={() => void finish('new-idea')}>
                  <Plus data-icon="inline-start" />
                  New idea
                </Button>
              </CardFooter>
            ) : (
              <CardFooter className="justify-between gap-2">
                {canGoBack ? (
                  <Button size="sm" variant="ghost" onClick={goBack}>
                    <ArrowLeft data-icon="inline-start" />
                    Back
                  </Button>
                ) : (
                  <span />
                )}
                {waiting ? (
                  <Button size="sm" variant="link" className="text-muted-foreground" onClick={goNext}>
                    Skip this step
                  </Button>
                ) : (
                  <Button size="sm" onClick={goNext}>
                    Next
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
