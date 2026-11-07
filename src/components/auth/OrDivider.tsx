import { Separator } from '@/components/ui/separator';

export function OrDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <Separator className="flex-1" />
    </div>
  );
}
