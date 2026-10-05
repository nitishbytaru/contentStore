'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export interface Article {
  id: string;
  originalTopic: string;
  articleContent: string;
  xPostContent: string;
  videoPromptContent: string;
  createdAt: string;
  updatedAt: string;
}

interface ArticleContextType {
  article: Article | null;
  loading: boolean;
  error: string | null;
  updateArticle: (data: Article) => void;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export function ArticleProvider({ id, children }: { id: string; children: React.ReactNode }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/articles?id=${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch article');
        setArticle(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  return (
    <ArticleContext.Provider value={{ article, loading, error, updateArticle: setArticle }}>
      {children}
    </ArticleContext.Provider>
  );
}

export function useArticle() {
  const context = useContext(ArticleContext);
  if (!context) throw new Error('useArticle must be used within ArticleProvider');
  return context;
}
