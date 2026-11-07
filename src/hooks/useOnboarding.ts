'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { ideasApi } from '@/store/api/ideasApi';
import { promptsApi } from '@/store/api/promptsApi';
import { endTour, startTour } from '@/store/slices/tourSlice';
import type { AppDispatch, RootState } from '@/store';

/** Reads whether the signed-in user has finished or dismissed onboarding. */
export async function fetchOnboardingDone(): Promise<boolean> {
  try {
    const { data } = await createClient().auth.getUser();
    return Boolean(data.user?.user_metadata?.onboarding?.completedAt);
  } catch {
    return true; // Never block the app on this check.
  }
}

/** Shared actions for starting and finishing the onboarding product tour. */
export function useOnboarding() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const sampleIdeaId = useSelector((state: RootState) => state.tour.sampleIdeaId);
  const [starting, setStarting] = useState(false);
  const [skipping, setSkipping] = useState(false);

  /** Prepares the sample idea (created once, then reused) and starts the tour on /ideas. */
  const beginTour = useCallback(async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/onboarding/sample', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.data?.ideaId) throw new Error(body?.error || 'Could not prepare the tour');

      dispatch(ideasApi.util.invalidateTags([{ type: 'Idea', id: 'LIST' }]));
      dispatch(promptsApi.util.invalidateTags([{ type: 'Prompt', id: 'LIST' }]));
      dispatch(startTour({ sampleIdeaId: body.data.ideaId }));
      router.push('/ideas');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start the tour');
      return false;
    } finally {
      setStarting(false);
    }
  }, [dispatch, router]);

  /** Ends the tour and records that onboarding is done, so it is not offered again. */
  const completeOnboarding = useCallback(
    async (options?: { skipped?: boolean }) => {
      dispatch(endTour());
      try {
        await createClient().auth.updateUser({
          data: { onboarding: { completedAt: new Date().toISOString(), skipped: Boolean(options?.skipped) } },
        });
      } catch (error) {
        console.warn('Could not save onboarding status:', error);
      }
    },
    [dispatch]
  );

  /**
   * Skips the demo immediately: closes the tour, removes the sample idea and prompt,
   * and records onboarding as done so it is never offered again.
   */
  const skipTour = useCallback(async () => {
    setSkipping(true);
    dispatch(endTour());
    if (sampleIdeaId && pathname === `/ideas/${sampleIdeaId}`) router.push('/ideas');

    // Hide the sample data right away. The server delete below takes a few seconds, and the
    // sample card must not stay clickable while its idea is being removed.
    dispatch(ideasApi.util.updateQueryData('getIdeas', undefined, (ideas) => ideas.filter((idea) => !idea.isSample)));
    dispatch(promptsApi.util.updateQueryData('getPrompts', undefined, (prompts) => prompts.filter((prompt) => !prompt.isSample)));

    try {
      const res = await fetch('/api/onboarding/sample', { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      toast.error('Tour skipped, but the sample idea could not be removed. You can delete it from your ideas.');
    } finally {
      dispatch(ideasApi.util.invalidateTags([{ type: 'Idea', id: 'LIST' }]));
      dispatch(promptsApi.util.invalidateTags([{ type: 'Prompt', id: 'LIST' }]));
      await completeOnboarding({ skipped: true });
      setSkipping(false);
    }
  }, [dispatch, sampleIdeaId, pathname, router, completeOnboarding]);

  return { beginTour, completeOnboarding, skipTour, starting, skipping };
}
