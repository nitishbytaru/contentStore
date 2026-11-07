'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Compass, PartyPopper, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { TOUR_STEPS, TOUR_STORAGE_KEY, TourStep } from '@/lib/onboarding/tour-steps';
import { useDeleteIdeaMutation } from '@/store/api/ideasApi';
import { hydrateTour, nextStep, prevStep } from '@/store/slices/tourSlice';
import type { AppDispatch, RootState } from '@/store';
import { cn } from 'cn';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;
const CARD_GAP = 12;
const CARD_MAX_WIDTH = 340;
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
      <div className="fixed bottom-4 left-4 z-[150] flex items-center gap-1 rounded-full border border-border bg-popover p-1 pl-3 shadow-lg animate-in fade-in-0 slide-in-from-bottom-2">
        <Compass className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium px-1">Tour paused</span>
        <Button size="sm" className="h-7 rounded-full text-xs" onClick={() => expectedPath && router.push(expectedPath)}>
          Resume
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-full text-xs text-muted-foreground"
          title="Skip the tour and remove the sample data"
          disabled={skipping}
          onClick={() => void skipTour()}
        >
          <X className="h-3.5 w-3.5" />
          Skip tour
        </Button>
      </div>
    );
  }

  const waiting = step.advance !== 'next';
  const centred = !rect;
  // Show nothing for a moment while the target loads, to avoid a centred-card flash.
  if (centred && !timedOut) return null;

  // Card placement: below the target, else above, else pinned to the bottom of the screen.
  const vw = viewport.width || (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const vh = viewport.height || (typeof window !== 'undefined' ? window.innerHeight : 768);
  const cardWidth = Math.min(CARD_MAX_WIDTH, vw - 32);
  const estimatedHeight = cardHeight || 200;
  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { left: (vw - cardWidth) / 2, top: Math.max(16, (vh - estimatedHeight) / 2), width: cardWidth };
  } else {
    const left = Math.min(Math.max(16, rect.left), vw - cardWidth - 16);
    const below = rect.top + rect.height + PAD + CARD_GAP;
    const above = rect.top - PAD - CARD_GAP - estimatedHeight;
    if (below + estimatedHeight <= vh - 16) cardStyle = { left, top: below, width: cardWidth };
    else if (above >= 16) cardStyle = { left, top: above, width: cardWidth };
    else cardStyle = { left: (vw - cardWidth) / 2, bottom: 16, width: cardWidth };
  }

  const prev = TOUR_STEPS[stepIndex - 1];
  const canGoBack = Boolean(prev && prev.advance === 'next' && !waiting);

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
          className="fixed z-[151] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl"
          style={cardStyle}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Step {stepIndex + 1} of {TOUR_STEPS.length}
              </p>
              <h2 className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                {isLast && <PartyPopper className="h-4 w-4 text-primary" />}
                {step.title}
              </h2>
            </div>
            {!isLast && (
              <button
                type="button"
                onClick={() => void skipTour()}
                disabled={skipping}
                className="-mr-1.5 -mt-1 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
                title="Skip the tour and remove the sample data"
              >
                Skip tour
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.body}</p>

          {waiting && step.waitingHint && (
            <p className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {step.waitingHint}
            </p>
          )}

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          {isLast ? (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
                disabled={deleting}
                onClick={() => void finish('delete-sample')}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete sample
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void finish()}>
                Done
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={() => void finish('new-idea')}>
                <Plus className="h-3.5 w-3.5" />
                New idea
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-2">
              {canGoBack ? (
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={goBack}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              {waiting ? (
                <button
                  type="button"
                  onClick={goNext}
                  className={cn('text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer')}
                >
                  Skip this step
                </button>
              ) : (
                <Button size="sm" className="h-8 text-xs" onClick={goNext}>
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
