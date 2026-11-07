import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'ContentStore: from idea to article to script',
  description:
    'Keep every content idea in one place. Research it from your own sources, generate the article, store the script and record with a built-in teleprompter.',
};

// Signed-in visitors are redirected to /ideas by the proxy (src/lib/supabase/middleware.ts).
export default function HomePage() {
  return <LandingPage />;
}
