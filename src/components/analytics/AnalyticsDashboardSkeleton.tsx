import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-60" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="rounded-xl border-border/80">
            <CardContent className="p-3.5 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-xl">
            <CardContent className="p-4 space-y-2.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl border-border/75">
        <CardContent className="p-6">
          <Skeleton className="h-[280px] w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
