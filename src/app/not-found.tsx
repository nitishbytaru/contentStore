'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Compass, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/components/StatusPage';

/** Shown for any URL that doesn't match a route, and wherever notFound() is called. */
export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <title>Page not found · ContentStore</title>
      <StatusPage
        code="404"
        icon={Compass}
        title="This page doesn't exist"
        description="The link may be broken, or the page may have been moved or deleted. Check the address, or head back to your ideas."
        actions={
          <>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft data-icon="inline-start" />
              Go back
            </Button>
            <Button nativeButton={false} render={<Link href="/ideas" />}>
              <Lightbulb data-icon="inline-start" />
              Go to my ideas
            </Button>
          </>
        }
      />
    </>
  );
}
