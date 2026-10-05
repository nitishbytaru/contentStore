import { TweetPlanner } from '@/components/TweetPlanner';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-12 px-6">
      <div className="max-w-5xl mx-auto w-full">
        <TweetPlanner />
      </div>
    </div>
  );
}
