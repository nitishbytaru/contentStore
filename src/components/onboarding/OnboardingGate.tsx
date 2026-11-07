'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchOnboardingDone, useOnboarding } from '@/hooks/useOnboarding';
import { WelcomeDialog } from '@/components/onboarding/WelcomeDialog';
import type { RootState } from '@/store';

/**
 * Offers the onboarding tour once to new users: only when onboarding was never
 * completed or dismissed AND the user has no ideas yet, so existing users never see it.
 */
export function OnboardingGate({ ideasLoaded, ideaCount }: { ideasLoaded: boolean; ideaCount: number }) {
  const { active, hydrated } = useSelector((state: RootState) => state.tour);
  const { beginTour, completeOnboarding, starting } = useOnboarding();
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchOnboardingDone().then((value) => {
      if (!cancelled) setDone(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const open = done === false && ideasLoaded && ideaCount === 0 && hydrated && !active;

  return (
    <WelcomeDialog
      open={open}
      starting={starting}
      onStart={async () => {
        const ok = await beginTour();
        if (ok) setDone(true);
      }}
      onDismiss={() => {
        setDone(true);
        void completeOnboarding({ skipped: true });
      }}
    />
  );
}
