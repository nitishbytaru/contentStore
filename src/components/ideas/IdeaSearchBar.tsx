import { Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface IdeaSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onNewIdea: () => void;
}

export function IdeaSearchBar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onNewIdea,
}: IdeaSearchBarProps) {
  return (
    <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full">
      <div className="relative flex-1 sm:max-w-md min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ideas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 w-full text-xs sm:text-sm bg-card border-border/80 focus-visible:ring-primary shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <Button
        onClick={onNewIdea}
        className="shrink-0 h-10 px-4 text-xs sm:text-sm font-semibold gap-1.5 shadow-xs cursor-pointer"
        title="Open Dedicated Idea Creator"
      >
        <Plus className="h-4 w-4" />
        <span>New Idea</span>
      </Button>
    </div>
  );
}
