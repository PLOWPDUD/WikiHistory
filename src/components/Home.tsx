
import { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Article } from '../types';
import { formatDate } from '../lib/utils';
import { Newspaper, Flag, Sword, Calendar, History, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onSelectArticle: (article: Article) => void;
  onRandomArticle: () => void;
  onNavigate: (view: any) => void;
  searchQuery: string;
  isSearchView?: boolean;
}

const TYPE_ICONS = {
  country: Flag,
  war: Sword,
  event: Calendar,
  person: Newspaper,
  culture: Newspaper,
};

export default function Home({ onSelectArticle, onRandomArticle, onNavigate, searchQuery, isSearchView }: HomeProps) {
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

  const filtered = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3 space-y-8">
        {!isSearchView ? (
          <section className="bg-white border border-[#a2a9b1] rounded-sm p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#202122]">
              <TrendingUp className="w-6 h-6 text-[#3366cc]" />
              <h2 className="font-serif text-2xl font-bold border-b-2 border-[#3366cc] w-fit pr-4">Welcome to WikiHistory</h2>
            </div>
            <p className="text-[#202122] mb-6 leading-relaxed max-w-3xl">
              The free alternate history encyclopedia that anyone can edit (with AI). 
              Explore over <span className="font-bold">1.2 million</span> imaginary events, fictional countries, 
              and impossible wars from across the multiverse.
            </p>
            
            <div className="bg-[#f8f9fa] border border-[#a2a9b1] p-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-[#3366cc] uppercase text-xs tracking-wider">Recently Added</h3>
                <p className="text-xs text-[#54595d]">Discover the latest shifts in timeline reality.</p>
              </div>
              <button 
                onClick={onRandomArticle}
                className="text-xs font-bold bg-white px-4 py-2 border border-[#a2a9b1] hover:bg-[#eaecf0] transition-colors rounded-sm uppercase tracking-tighter"
              >
                Discover random
              </button>
            </div>
          </section>
        ) : (
          <section className="pb-4 border-b border-[#a2a9b1] mb-6">
            <h2 className="font-serif text-3xl">Search results</h2>
            <p className="text-sm text-[#54595d] mt-1">Showing matches for: <span className="font-bold italic">"{searchQuery}"</span></p>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-sm" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((article) => (
              <motion.article 
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ borderColor: '#3366cc', backgroundColor: '#fdfdfd' }}
                onClick={() => onSelectArticle(article)}
                className="bg-white border border-[#a2a9b1] p-6 rounded-sm shadow-sm cursor-pointer transition-all flex flex-col h-full group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-[#f8f9fa] rounded-sm text-[#3366cc] group-hover:bg-[#3366cc] group-hover:text-white transition-colors">
                    {(() => {
                      const Icon = TYPE_ICONS[article.type] || Newspaper;
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#54595d] tracking-widest bg-[#eaecf0] px-2 py-1 rounded-full">
                    {article.type}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-[#3366cc] transition-colors">{article.title}</h3>
                <p className="text-[13px] text-[#54595d] line-clamp-3 mb-4 leading-normal flex-1">
                  {article.summary}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#54595d] border-t border-[#eaecf0] pt-3 mt-auto">
                  <span className="flex items-center gap-1"><History className="w-3 h-3" /> {formatDate(article.createdAt)}</span>
                  <span className="font-bold text-[#3366cc] group-hover:underline">Read entry →</span>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="col-span-full py-20 text-center opacity-50">
              <Newspaper className="w-16 h-16 mx-auto mb-4" />
              <p className="font-serif text-xl">No articles found matching your query.</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <aside className="bg-[#f8f9fa] border border-[#a2a9b1] p-6 rounded-sm">
          <h3 className="font-serif text-xl font-bold mb-4 border-b border-[#a2a9b1] pb-2 text-[#202122]">Wiki News</h3>
          <ul className="space-y-4 text-sm leading-snug">
            <li className="flex gap-2">
              <span className="font-bold text-[#3366cc]">May 5:</span>
              <span>Timeline #402 stabilised after the Great Silicon War (AI).</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#3366cc]">May 3:</span>
              <span>10,000th article on imaginary monarchs published.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#3366cc]">Apr 28:</span>
              <span>New AI model "Gemini-3" integrated for faster history drafting.</span>
            </li>
          </ul>
        </aside>

        <aside className="bg-white border border-[#a2a9b1] p-6 rounded-sm shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#3366cc]/5 rounded-full -mr-16 -mt-16" />
          <h3 className="font-serif text-xl font-bold mb-4 text-[#202122]">Contribute</h3>
          <p className="text-sm text-[#54595d] mb-6">
            Witnessed an alternate reality? Help us document the impossible.
          </p>
          <button 
            onClick={() => onNavigate('create')}
            className="w-full bg-[#3366cc] text-white py-2 rounded-sm font-bold text-sm hover:bg-[#2a52a4] transition-colors shadow-sm"
          >
            Draft New Entry
          </button>
        </aside>
      </div>
    </div>
  );
}
