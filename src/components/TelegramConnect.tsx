'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BotMessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

export function TelegramConnect({ className = '', onDone }: { className?: string; onDone?: () => void }) {
  const [linked, setLinked] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/telegram/link', { cache: 'no-store' });
      if (!res.ok) return null;
      const body = await res.json();
      setLinked(Boolean(body.linked));
      return Boolean(body.linked);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/telegram/link', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body) setLinked(Boolean(body.linked));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, []);

  const connect = async () => {
    // Open the tab synchronously so popup blockers allow it, then point it at the bot.
    const tab = window.open('', '_blank');
    try {
      setBusy(true);
      const res = await fetch('/api/telegram/link', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not create link');

      if (tab) tab.location.href = body.url;
      else window.location.href = body.url;
      toast.info('Tap "Start" in Telegram to finish connecting.');
      onDone?.();

      stopPolling();
      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        const isLinked = await fetchStatus();
        if (isLinked) {
          stopPolling();
          toast.success('Telegram connected');
        } else if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          stopPolling();
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      tab?.close();
      toast.error(error.message || 'Failed to connect Telegram');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Telegram from your ContentStore account?')) return;
    try {
      setBusy(true);
      const res = await fetch('/api/telegram/link', { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not disconnect');
      setLinked(false);
      toast.success('Telegram disconnected');
      onDone?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast.error(error.message || 'Failed to disconnect Telegram');
    } finally {
      setBusy(false);
    }
  };

  if (linked === null) return null;

  return (
    <button
      onClick={linked ? disconnect : connect}
      disabled={busy}
      title={linked ? 'Telegram connected — click to disconnect' : 'Connect the ContentStore Telegram bot'}
      className={className}
    >
      <BotMessageSquare className={`w-3.5 h-3.5 ${linked ? 'text-emerald-500' : ''}`} />
      <span>{busy ? 'Working...' : linked ? 'Telegram connected' : 'Connect Telegram'}</span>
    </button>
  );
}
