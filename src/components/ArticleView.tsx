
import Markdown from 'react-markdown';
import { Article } from '../types';
import Infobox from './Infobox';
import { BookOpen, Share2, History, Languages, Edit } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface ArticleViewProps {
  article: Article;
  onEdit?: (article: Article) => void;
}

export default function ArticleView({ article, onEdit }: ArticleViewProps) {
  const { user } = useAuth();
  const toc = article.sections.map(s => s.title);
  const isAdmin = user?.email === "videosonli5@gmail.com";
  const isAuthor = user?.uid === article.authorId || isAdmin;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between border-b border-[#a2a9b1] pb-2 mb-6">
            <h1 className="font-serif text-3xl md:text-4xl text-[#202122]">{article.title}</h1>
            <div className="hidden sm:flex items-center gap-4 text-[12px] text-[#3366cc]">
              {isAuthor && onEdit && (
                <button onClick={() => onEdit(article)} className="hover:underline flex items-center gap-1 font-bold text-[#202122] bg-[#eaecf0] px-2 py-1 rounded-sm">
                  <Edit className="w-3 h-3" /> Edit article
                </button>
              )}
              <button className="hover:underline flex items-center gap-1"><Languages className="w-3 h-3" /> 12 languages</button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('wiki-navigate', { detail: 'recent-changes' }))} 
                className="hover:underline flex items-center gap-1"
              >
                <History className="w-3 h-3" /> View history
              </button>
            </div>
          </div>

          <p className="text-[14px] text-[#54595d] mb-4 font-sans border-b border-[#eaecf0] pb-2">
            From WikiHistory, the alternate history encyclopedia
          </p>

          <Infobox article={article} />

          <div className="prose prose-slate max-w-none prose-sm font-sans text-[#202122] leading-relaxed">
            <p className="mb-6 first-letter:text-4xl first-letter:float-left first-letter:font-serif first-letter:mr-2">
              {article.summary}
            </p>

            {/* Table of Contents - Standard Wikipedia Style */}
            <nav className="mb-8 p-4 bg-[#f8f9fa] border border-[#a2a9b1] w-fit min-w-[200px] text-xs">
              <div className="flex items-center justify-center gap-4 mb-2 font-bold bg-[#eaecf0]/50 p-1">
                <span>Contents</span>
              </div>
              <ul className="space-y-1 marker:text-[#54595d]">
                {toc.map((title, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="opacity-50">{i + 1}</span>
                    <a href={`#${title.replace(/\s+/g, '-')}`} className="text-[#3366cc] hover:underline">{title}</a>
                  </li>
                ))}
              </ul>
            </nav>

            {article.sections.map((section, idx) => (
              <div key={idx} className="mb-12" id={section.title.replace(/\s+/g, '-')}>
                <h2 className="font-serif text-2xl border-b border-[#a2a9b1] pb-1 mt-8 mb-6 flex items-baseline gap-3">
                  <span className="text-[#54595d] text-xl italic font-sans">{idx + 1}</span>
                  {section.title}
                </h2>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 markdown-body">
                    <Markdown>{section.content}</Markdown>
                  </div>
                  
                  {((section.images && section.images.length > 0) || section.imageUrl) && (
                    <div className="w-full md:w-64 flex-shrink-0 space-y-4">
                      {section.images && section.images.length > 0 ? (
                        section.images.map((img, i) => (
                          <figure key={i} className="bg-[#f8f9fa] border border-[#a2a9b1] p-1">
                            <img 
                              src={img.url} 
                              alt={img.caption || section.title} 
                              className="w-full h-auto object-contain border border-[#eaecf0]"
                              referrerPolicy="no-referrer"
                            />
                            {img.caption && (
                              <figcaption className="p-2 text-[11px] leading-snug text-[#54595d] italic">
                                {img.caption}
                              </figcaption>
                            )}
                          </figure>
                        ))
                      ) : (
                        <figure className="bg-[#f8f9fa] border border-[#a2a9b1] p-1">
                          <img 
                            src={section.imageUrl} 
                            alt={section.imageCaption || section.title} 
                            className="w-full h-auto object-contain border border-[#eaecf0]"
                            referrerPolicy="no-referrer"
                          />
                          {section.imageCaption && (
                            <figcaption className="p-2 text-[11px] leading-snug text-[#54595d] italic">
                              {section.imageCaption}
                            </figcaption>
                          )}
                        </figure>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <footer className="mt-12 pt-8 border-t border-[#a2a9b1] text-xs text-[#54595d] space-y-4">
            <div className="bg-[#f8f9fa] p-4 border border-[#a2a9b1] rounded-sm">
              <p className="font-bold mb-1">Categories:</p>
              <p className="text-[#3366cc] space-x-2">
                <span className="hover:underline cursor-pointer">{article.type.charAt(0).toUpperCase() + article.type.slice(1)}s</span>
                <span>|</span>
                <span className="hover:underline cursor-pointer">Alt-History</span>
                <span>|</span>
                <span className="hover:underline cursor-pointer">Generated Content</span>
              </p>
            </div>
            <p className="flex items-center gap-4">
              <span>This page was last edited on {formatDate(article.createdAt)}.</span>
              <span>Content is available under CC BY-SA 4.0 unless otherwise noted.</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
