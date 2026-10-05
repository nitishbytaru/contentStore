import { ArticleProvider } from '@/components/ArticleContext';
import Link from 'next/link';
import { ArrowLeft, FileText, MessageCircle, Video } from 'lucide-react';

export default async function ArticleLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ArticleProvider id={id}>
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-5xl mx-auto w-full">
           <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
             <Link href="/articles" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
               <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
             </Link>
             <nav className="flex space-x-6">
               <Link href={`/articles/${id}/basearticle`} className="flex items-center hover:text-foreground transition-colors text-muted-foreground font-medium">
                 <FileText className="w-4 h-4 mr-2" /> Base Article
               </Link>
               <Link href={`/articles/${id}/tweet`} className="flex items-center hover:text-foreground transition-colors text-muted-foreground font-medium">
                 <MessageCircle className="w-4 h-4 mr-2" /> X Thread
               </Link>
               <Link href={`/articles/${id}/videoscript`} className="flex items-center hover:text-foreground transition-colors text-muted-foreground font-medium">
                 <Video className="w-4 h-4 mr-2" /> Video Script
               </Link>
             </nav>
           </div>
           {children}
        </div>
      </div>
    </ArticleProvider>
  );
}
