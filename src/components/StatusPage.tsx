'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from 'cn';

/**
 * Shared full-page message used by the 404 page, the error pages and "not found" states.
 */
export function StatusPage({
  code,
  icon: Icon,
  title,
  description,
  actions,
  details,
  tone = 'default',
  className,
}: {
  code?: string;
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  /** Small print under the description, e.g. an error reference. */
  details?: ReactNode;
  tone?: 'default' | 'destructive';
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-[70vh] w-full items-center justify-center px-0 py-8 sm:px-4', className)}>
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="items-center justify-items-center gap-3 pt-2">
          <div className="relative">
            <span
              aria-hidden
              className={cn(
                'absolute inset-0 rounded-2xl blur-xl',
                tone === 'destructive' ? 'bg-destructive/25' : 'bg-primary/25'
              )}
            />
            <div
              className={cn(
                'relative flex h-14 w-14 items-center justify-center rounded-2xl',
                tone === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              )}
            >
              <Icon className="h-7 w-7" />
            </div>
          </div>
          {code && (
            <Badge variant="outline" className="font-mono text-[11px] font-medium text-muted-foreground">
              {code}
            </Badge>
          )}
          <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</CardTitle>
          <CardDescription className="mx-auto max-w-sm text-sm leading-relaxed">{description}</CardDescription>
        </CardHeader>
        {details && (
          <CardContent>
            <p className="break-all font-mono text-[11px] text-muted-foreground">{details}</p>
          </CardContent>
        )}
        {actions && (
          <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-center [&>*]:w-full sm:[&>*]:w-auto">
            {actions}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
