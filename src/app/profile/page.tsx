'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Compass,
  Lightbulb,
  LogIn,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOnboarding } from '@/hooks/useOnboarding';
import type { ProfileSummary } from '@/lib/account';
import { TOUR_STORAGE_KEY } from '@/lib/onboarding/tour-steps';
import { endBlocking, startBlocking } from '@/store/slices/uiSlice';
import { endTour } from '@/store/slices/tourSlice';
import { ideasApi } from '@/store/api/ideasApi';
import { promptsApi } from '@/store/api/promptsApi';
import type { AppDispatch } from '@/store';

const CONFIRM_PHRASE = 'DELETE';
const DELETING_LABEL = 'Deleting your account and all data…';

function formatDate(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function DetailRow({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/40 last:border-0">
      <span className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm text-foreground text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { beginTour, starting } = useOnboarding();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile')
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || 'Could not load your profile');
        if (!cancelled) setProfile(body.data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Could not load your profile');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const deleteAccount = async () => {
    if (confirmText !== CONFIRM_PHRASE || deleting) return;
    setDeleting(true);
    setConfirmOpen(false);
    dispatch(startBlocking(DELETING_LABEL));
    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: CONFIRM_PHRASE }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Could not delete your account');

      try {
        window.localStorage.removeItem(TOUR_STORAGE_KEY);
      } catch {
        // Storage may be unavailable; nothing else to clean up.
      }
      // Drop every cached piece of the deleted account's data before leaving.
      dispatch(endTour());
      dispatch(ideasApi.util.resetApiState());
      dispatch(promptsApi.util.resetApiState());
      dispatch(endBlocking(DELETING_LABEL));
      toast.success('Your account and all data were deleted');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete your account');
      dispatch(endBlocking(DELETING_LABEL));
      setDeleting(false);
      setConfirmText('');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
          <p className="text-xs text-muted-foreground truncate">
            {profile ? profile.email : 'Your account details and data'}
          </p>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Could not load your profile</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Account</CardTitle>
            <CardDescription className="text-xs">How you sign in to ContentStore.</CardDescription>
          </CardHeader>
          <CardContent>
            {!profile && !loadError ? (
              <div className="space-y-3 py-1">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : profile ? (
              <div>
                <DetailRow icon={Mail} label="Email">{profile.email}</DetailRow>
                <DetailRow icon={BadgeCheck} label="Email status">
                  {profile.emailConfirmed ? (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">Not verified</Badge>
                  )}
                </DetailRow>
                <DetailRow icon={CalendarDays} label="Member since">{formatDate(profile.createdAt)}</DetailRow>
                <DetailRow icon={LogIn} label="Last sign-in">{formatDateTime(profile.lastSignInAt)}</DetailRow>
                <DetailRow icon={Send} label="Telegram">
                  {profile.telegramLinked ? (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Connected</Badge>
                  ) : (
                    <span className="text-muted-foreground">Not connected</span>
                  )}
                </DetailRow>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Your content</CardTitle>
            <CardDescription className="text-xs">Everything stored in your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {!profile && !loadError ? (
              <div className="grid grid-cols-2 gap-2.5 py-1">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
                ))}
              </div>
            ) : profile ? (
              <div className="grid grid-cols-2 gap-2.5">
                <StatTile icon={Lightbulb} label="Ideas" value={profile.stats.ideas} />
                <StatTile icon={CheckCircle2} label="Completed ideas" value={profile.stats.completedIdeas} />
                <StatTile icon={Sparkles} label="Prompts" value={profile.stats.prompts} />
                <StatTile icon={MessageSquare} label="Research messages" value={profile.stats.researchMessages} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-medium">Product tour</p>
            <p className="text-xs text-muted-foreground">Walk through ContentStore again with a sample idea.</p>
          </div>
          <Button variant="outline" size="sm" disabled={starting} onClick={() => void beginTour()} className="shrink-0">
            <Compass className="h-3.5 w-3.5" />
            {starting ? 'Preparing…' : 'Replay tour'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-destructive/[0.03]">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger zone
          </CardTitle>
          <CardDescription className="text-xs">
            Permanently delete your account and everything in it: ideas, research chats, uploaded context, articles,
            video scripts, prompts and your Telegram connection. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting || !profile}
            onClick={() => {
              setConfirmText('');
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete account and all data
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !deleting && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account
              {profile ? <> (<span className="font-medium text-foreground">{profile.email}</span>)</> : null} and all of
              its data. You will be signed out and cannot recover anything.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="confirm-delete" className="text-xs text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <Input
              id="confirm-delete"
              value={confirmText}
              autoComplete="off"
              onChange={(event) => setConfirmText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void deleteAccount();
              }}
              placeholder={CONFIRM_PHRASE}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmText !== CONFIRM_PHRASE || deleting}
              onClick={() => void deleteAccount()}
            >
              Delete everything
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
