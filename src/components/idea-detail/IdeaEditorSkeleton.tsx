import { Skeleton } from '@/components/ui/skeleton';

export function IdeaEditorSkeleton() {
  return (
    <div className="space-y-6 pt-2 w-full max-w-full min-w-0">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="space-y-4 w-full min-w-0">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[480px] w-full rounded-lg" />
      </div>
    </div>
  );
}
