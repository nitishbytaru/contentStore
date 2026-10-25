import { Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { recordTopicTime } from '@/lib/timeTracking';
import { toast } from 'sonner';
import { Idea } from '@/types';

interface TimerTopicSelectorProps {
  ideas: Idea[];
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
}

export function TimerTopicSelector({
  ideas,
  selectedTopicId,
  onSelectTopic,
}: TimerTopicSelectorProps) {
  const handleQuickAdd = (seconds: number, label: string) => {
    if (!selectedTopicId) return;
    recordTopicTime(selectedTopicId, seconds);
    toast.success(`Added ${label} to topic!`);
  };

  return (
    <div className="pt-1.5 space-y-1.5">
      <div className="flex items-center justify-between gap-1 text-[11px]">
        <span className="text-muted-foreground font-medium">Link session to topic:</span>
        {selectedTopicId && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleQuickAdd(15 * 60, '+15m')}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border/50 cursor-pointer transition-colors"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(30 * 60, '+30m')}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border/50 cursor-pointer transition-colors"
            >
              +30m
            </button>
          </div>
        )}
      </div>

      <Select
        value={selectedTopicId || 'none'}
        onValueChange={(val) => onSelectTopic(val === 'none' ? '' : val || '')}
      >
        <SelectTrigger className="w-full text-xs h-8 bg-background/80 border-border/80 text-foreground">
          <SelectValue placeholder="-- General Focus (No specific topic) --" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">-- General Focus (No specific topic) --</SelectItem>
          {ideas.map((idea) => (
            <SelectItem key={idea.ideaId} value={idea.ideaId}>
              {idea.idea || 'Untitled Topic'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1 pt-0.5">
        <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        <span>Timer strictly pauses if the mobile browser is minimized or sent to background.</span>
      </p>
    </div>
  );
}
