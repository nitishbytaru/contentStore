import { Film, Scissors, Upload, Calendar, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toDateTimeLocalValue } from '@/utils/dateTime';
import { cn } from 'cn';

interface IdeaVideoStagesModalProps {
  isOpen: boolean;
  saving: boolean;
  tempShootingDone: boolean;
  tempShootingAt: string;
  tempEditingDone: boolean;
  tempEditingAt: string;
  tempUploadedDone: boolean;
  tempUploadedAt: string;
  onClose: () => void;
  onSave: () => void;
  setTempShootingDone: (done: boolean) => void;
  setTempShootingAt: (val: string) => void;
  setTempEditingDone: (done: boolean) => void;
  setTempEditingAt: (val: string) => void;
  setTempUploadedDone: (done: boolean) => void;
  setTempUploadedAt: (val: string) => void;
}

export function IdeaVideoStagesModal({
  isOpen,
  saving,
  tempShootingDone,
  tempShootingAt,
  tempEditingDone,
  tempEditingAt,
  tempUploadedDone,
  tempUploadedAt,
  onClose,
  onSave,
  setTempShootingDone,
  setTempShootingAt,
  setTempEditingDone,
  setTempEditingAt,
  setTempUploadedDone,
  setTempUploadedAt,
}: IdeaVideoStagesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Update Video Production Stages</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Answer the stage questions and adjust the recorded date &amp; time anytime.
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Question 1: Shooting Completed? */}
          <div
            className={cn(
              'p-3.5 rounded-xl border transition-all space-y-3',
              tempShootingDone ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border/70 bg-muted/20'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'p-1.5 rounded-lg',
                    tempShootingDone
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">1. Is shooting completed?</h4>
                  <p className="text-xs text-muted-foreground">Video footage recording finished</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={tempShootingDone ? 'default' : 'outline'}
                onClick={() => {
                  const next = !tempShootingDone;
                  setTempShootingDone(next);
                  if (next && !tempShootingAt) {
                    setTempShootingAt(toDateTimeLocalValue());
                  }
                }}
                className={cn(
                  'h-8 text-xs font-semibold gap-1 cursor-pointer',
                  tempShootingDone && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                {tempShootingDone ? <Check className="w-3.5 h-3.5" /> : null}
                {tempShootingDone ? 'Completed ✓' : 'Mark Done'}
              </Button>
            </div>

            {tempShootingDone && (
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Shooting Date &amp; Time (editable at your will):
                </label>
                <Input
                  type="datetime-local"
                  value={tempShootingAt}
                  onChange={(e) => setTempShootingAt(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            )}
          </div>

          {/* Question 2: Editing Completed? */}
          <div
            className={cn(
              'p-3.5 rounded-xl border transition-all space-y-3',
              tempEditingDone ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border/70 bg-muted/20'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'p-1.5 rounded-lg',
                    tempEditingDone
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">2. Is editing completed?</h4>
                  <p className="text-xs text-muted-foreground">Cut, sound, color &amp; graphics finalized</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={tempEditingDone ? 'default' : 'outline'}
                onClick={() => {
                  const next = !tempEditingDone;
                  setTempEditingDone(next);
                  if (next && !tempEditingAt) {
                    setTempEditingAt(toDateTimeLocalValue());
                  }
                }}
                className={cn(
                  'h-8 text-xs font-semibold gap-1 cursor-pointer',
                  tempEditingDone && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                {tempEditingDone ? <Check className="w-3.5 h-3.5" /> : null}
                {tempEditingDone ? 'Completed ✓' : 'Mark Done'}
              </Button>
            </div>

            {tempEditingDone && (
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Editing Date &amp; Time (editable at your will):
                </label>
                <Input
                  type="datetime-local"
                  value={tempEditingAt}
                  onChange={(e) => setTempEditingAt(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            )}
          </div>

          {/* Question 3: Uploaded? */}
          <div
            className={cn(
              'p-3.5 rounded-xl border transition-all space-y-3',
              tempUploadedDone ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border/70 bg-muted/20'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'p-1.5 rounded-lg',
                    tempUploadedDone
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">3. Is video uploaded?</h4>
                  <p className="text-xs text-muted-foreground">Published / scheduled to YouTube or channel</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={tempUploadedDone ? 'default' : 'outline'}
                onClick={() => {
                  const next = !tempUploadedDone;
                  setTempUploadedDone(next);
                  if (next && !tempUploadedAt) {
                    setTempUploadedAt(toDateTimeLocalValue());
                  }
                }}
                className={cn(
                  'h-8 text-xs font-semibold gap-1 cursor-pointer',
                  tempUploadedDone && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                {tempUploadedDone ? <Check className="w-3.5 h-3.5" /> : null}
                {tempUploadedDone ? 'Uploaded ✓' : 'Mark Done'}
              </Button>
            </div>

            {tempUploadedDone && (
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Upload Date &amp; Time (editable at your will):
                </label>
                <Input
                  type="datetime-local"
                  value={tempUploadedAt}
                  onChange={(e) => setTempUploadedAt(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={saving}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Save Video Stages
          </Button>
        </div>
      </div>
    </div>
  );
}
