import { Layers, BookOpen, FileText, Video, Clock, CheckCircle } from 'lucide-react';
import { IdeaTypeFilter, IdeaStatusFilter } from '@/types';
import { cn } from 'cn';

interface FilterCounts {
  status: {
    pending: number;
    completed: number;
  };
  type: {
    all: number;
    research: number;
    article: number;
    video: number;
  };
}

interface IdeaFilterBarProps {
  typeFilter: IdeaTypeFilter;
  statusFilter: IdeaStatusFilter;
  filterCounts: FilterCounts;
  loading: boolean;
  onTypeFilterChange: (type: IdeaTypeFilter) => void;
  onStatusFilterChange: (status: IdeaStatusFilter) => void;
}

export function IdeaFilterBar({
  typeFilter,
  statusFilter,
  filterCounts,
  loading,
  onTypeFilterChange,
  onStatusFilterChange,
}: IdeaFilterBarProps) {
  const typeOptions: Array<{ id: IdeaTypeFilter; label: string; icon: any; count: number }> = [
    { id: 'all', label: 'All', icon: Layers, count: filterCounts.type.all },
    { id: 'research', label: 'Research', icon: BookOpen, count: filterCounts.type.research },
    { id: 'article', label: 'Article', icon: FileText, count: filterCounts.type.article },
    { id: 'video', label: 'Video', icon: Video, count: filterCounts.type.video },
  ];

  const statusOptions: Array<{ id: IdeaStatusFilter; label: string; icon: any; count: number }> = [
    { id: 'pending', label: 'Pending', icon: Clock, count: filterCounts.status.pending },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: filterCounts.status.completed },
  ];

  return (
    <div data-tour="idea-filters" className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 sm:p-2.5 rounded-2xl border border-border/75 bg-muted/20 backdrop-blur-xs">
      {/* Group 1: Content Type (All, Research, Article, Video) */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1.5 pr-0.5">
          Content:
        </span>
        {typeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = typeFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onTypeFilterChange(opt.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer select-none',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold ring-1 ring-primary/40'
                  : 'bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{opt.label}</span>
              {!loading && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-semibold leading-tight shrink-0',
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-foreground/10 text-muted-foreground'
                  )}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Group 2: Status (Pending, Completed) */}
      <div className="flex items-center gap-1 sm:gap-1.5 justify-start md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-border/60">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1.5 pr-0.5">
          Status:
        </span>
        {statusOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = statusFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onStatusFilterChange(opt.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer select-none',
                isSelected
                  ? 'bg-foreground text-background shadow-xs font-semibold ring-1 ring-foreground/40'
                  : 'bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{opt.label}</span>
              {!loading && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-semibold leading-tight shrink-0',
                    isSelected
                      ? 'bg-background/20 text-background'
                      : 'bg-foreground/10 text-muted-foreground'
                  )}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
