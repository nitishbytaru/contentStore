import { Clock, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Idea } from '@/types';

interface IdeaTimestampModalProps {
  editingDateKey: keyof Idea | null;
  editingDateValue: string;
  saving: boolean;
  onClose: () => void;
  onDateValueChange: (val: string) => void;
  onSaveDate: (field: keyof Idea) => void;
}

export function IdeaTimestampModal({
  editingDateKey,
  editingDateValue,
  saving,
  onClose,
  onDateValueChange,
  onSaveDate,
}: IdeaTimestampModalProps) {
  if (!editingDateKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold">Update Timestamp</h4>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Select or adjust custom date and time:
          </label>
          <Input
            type="datetime-local"
            value={editingDateValue}
            onChange={(e) => onDateValueChange(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onSaveDate(editingDateKey)}
            disabled={saving}
            className="font-medium px-3.5 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Save Time
          </Button>
        </div>
      </div>
    </div>
  );
}
