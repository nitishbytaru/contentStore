import { ArticleGenerator } from '@/components/ArticleGenerator';

export default function ArticlesPage() {
  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto w-full">
        <ArticleGenerator />
      </div>
    </div>
  );
}
