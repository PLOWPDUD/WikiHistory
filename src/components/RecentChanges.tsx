
import { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Article } from '../types';
import { formatDate } from '../lib/utils';
import { History, User, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface RecentChangesProps {
  onSelectArticle: (article: Article) => void;
}

export default function RecentChanges({ onSelectArticle }: RecentChangesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = 'articles';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 border-b border-[#a2a9b1] pb-2">
        <h1 className="font-serif text-3xl">Recent changes</h1>
        <p className="text-sm text-[#54595d] mt-1">Track the latest shifts across the multiverse timelines.</p>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="border border-[#eaecf0] rounded-sm divide-y divide-[#eaecf0]">
            {articles.map((article) => (
              <div 
                key={article.id} 
                className="p-3 hover:bg-[#f8f9fa] flex items-center justify-between group transition-colors cursor-pointer"
                onClick={() => onSelectArticle(article)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#eaecf0] p-1.5 rounded-sm">
                    <History className="w-4 h-4 text-[#54595d]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#3366cc] group-hover:underline">{article.title}</span>
                      <span className="text-[10px] uppercase font-bold text-[#54595d] opacity-50">({article.type})</span>
                    </div>
                    <p className="text-[11px] text-[#54595d] flex items-center gap-2 mt-0.5">
                      <User className="w-3 h-3" /> Anonymous contributor • 
                      <FileText className="w-3 h-3" /> {formatDate(article.createdAt)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#a2a9b1] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 opacity-40">
            <History className="w-16 h-16 mx-auto mb-4" />
            <p className="font-serif text-xl font-bold">The timelines are eerily quiet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
