'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { RootState } from '@/store';
import { ideasApi } from '@/store/api/ideasApi';
import { promptsApi } from '@/store/api/promptsApi';
import { APP_SHELL_ID } from '@/lib/app-shell';

/** Destructive RTK Query mutations that lock the whole UI while running, with their loader label. */
const BLOCKING_MUTATIONS: Record<string, string> = {
  deleteIdea: 'Deleting idea…',
  deletePrompt: 'Deleting prompt…',
  clearResearch: 'Clearing research…',
};


type MutationEntry = { status?: string; endpointName?: string };

function pendingLabels(mutations: Record<string, MutationEntry | undefined>): string[] {
  return Object.values(mutations)
    .filter((m): m is MutationEntry => Boolean(m && m.status === 'pending' && m.endpointName))
    .map((m) => BLOCKING_MUTATIONS[m.endpointName!])
    .filter(Boolean);
}

const selectBlockingLabel = (state: RootState): string | null => {
  const labels = [
    ...pendingLabels(state[ideasApi.reducerPath].mutations),
    ...pendingLabels(state[promptsApi.reducerPath].mutations),
    ...state.ui.blockingTasks,
  ];
  return labels[0] ?? null;
};

/**
 * Full-screen loader shown while any delete-type operation is in progress.
 * It also marks the app shell `inert`, so every other button, link and input
 * is disabled (mouse, touch and keyboard) until the operation completes.
 */
export function BlockingOverlay() {
  const label = useSelector(selectBlockingLabel);
  const active = label !== null;

  useEffect(() => {
    const shell = document.getElementById(APP_SHELL_ID);
    if (!shell) return;
    if (active) {
      (document.activeElement as HTMLElement | null)?.blur?.();
      shell.setAttribute('inert', '');
      shell.setAttribute('aria-busy', 'true');
    }
    return () => {
      shell.removeAttribute('inert');
      shell.removeAttribute('aria-busy');
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={label}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/70 backdrop-blur-sm px-4 animate-in fade-in-0 duration-150 cursor-wait"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-2xl">
        <Loader2 className="w-5 h-5 animate-spin text-destructive shrink-0" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
    </div>
  );
}
