import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

const title = 'ContentStore: from idea to article to script';
const description =
  'Keep every content idea in one place. Research it from your own sources, generate the article, store the script and record with a built-in teleprompter.';
// Lives in public/ with a .png extension so the auth proxy lets crawlers fetch it.
const image = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'ContentStore landing page',
};

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'ContentStore',
    title,
    description,
    images: [image],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [image],
  },
};

// Signed-in visitors are redirected to /ideas by the proxy (src/lib/supabase/middleware.ts).
export default function HomePage() {
  return <LandingPage />;
}
