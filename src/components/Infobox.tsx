
import { useState } from 'react';
import { Article, ArticleType } from '../types';
import { cn } from '../lib/utils';
import { Shield, Sword, Flag, Calendar, Loader2, Image as ImageIcon } from 'lucide-react';

interface InfoboxProps {
  article: Partial<Article>;
  isLoading?: boolean;
}

const TYPE_ICONS: Record<ArticleType, any> = {
  country: Flag,
  war: Sword,
  event: Calendar,
  person: Shield,
  culture: Shield,
};

export default function Infobox({ article, isLoading }: InfoboxProps) {
  const flags = (article.flags?.length ? article.flags : (article.flagUrl ? [article.flagUrl] : [])).filter(Boolean);
  const arms = (article.coatsOfArms || []).filter(Boolean);
  
  const [activeTab, setActiveTab] = useState<'flags' | 'arms'>(flags.length > 0 ? 'flags' : 'arms');
  const Icon = article.type ? TYPE_ICONS[article.type] : Shield;

  const hasMultipleMedia = flags.length > 0 && arms.length > 0;

  return (
    <aside className={cn(
      "w-full md:w-[300px] float-right clear-right ml-6 mb-6 border border-[#a2a9b1] bg-[#f8f9fa] p-1 text-[13px] leading-snug",
      isLoading && "animate-pulse"
    )}>
      <div className="bg-[#eaecf0] px-2 py-1.5 mb-1 text-center font-bold text-base leading-tight font-serif border-b border-[#a2a9b1]">
        {article.title || 'Generating Title...'}
      </div>

      {(flags.length > 0 || arms.length > 0) ? (
        <div className="bg-white border-b border-[#a2a9b1] mb-1 p-2">
          {article.type === 'country' ? (
            <>
              {hasMultipleMedia && (
                <div className="flex gap-1 mb-2">
                  <button 
                    onClick={() => setActiveTab('flags')}
                    className={cn(
                      "flex-1 py-1 text-[10px] font-bold uppercase tracking-tight transition-colors",
                      activeTab === 'flags' ? "bg-[#3366cc] text-white" : "bg-[#eaecf0] hover:bg-[#d0d4d9]"
                    )}
                  >
                    Flags
                  </button>
                  <button 
                    onClick={() => setActiveTab('arms')}
                    className={cn(
                      "flex-1 py-1 text-[10px] font-bold uppercase tracking-tight transition-colors",
                      activeTab === 'arms' ? "bg-[#3366cc] text-white" : "bg-[#eaecf0] hover:bg-[#d0d4d9]"
                    )}
                  >
                    Coat of Arms
                  </button>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-2 p-1 min-h-[140px] items-center">
                {activeTab === 'flags' ? (
                  flags.map((url, i) => (
                    <img 
                      key={i}
                      src={url} 
                      alt={`Flag ${i + 1}`} 
                      className={cn(
                        "object-contain border border-[#eaecf0] shadow-sm",
                        flags.length === 1 ? "max-h-[180px] w-full" : "max-h-[80px] max-w-[45%]"
                      )}
                      referrerPolicy="no-referrer"
                    />
                  ))
                ) : (
                  arms.map((url, i) => (
                    <img 
                      key={i}
                      src={url} 
                      alt={`Coat of Arms ${i + 1}`} 
                      className={cn(
                        "object-contain border border-[#eaecf0] p-1",
                        arms.length === 1 ? "max-h-[180px] w-full" : "max-h-[90px] max-w-[45%]"
                      )}
                      referrerPolicy="no-referrer"
                    />
                  ))
                )}
              </div>
              <p className="text-[10px] mt-2 text-center text-[#54595d] italic font-sans border-t border-[#f8f9fa] pt-1">
                {activeTab === 'flags' ? `Flag(s) of ${article.title}` : `Coat(s) of arms of ${article.title}`}
              </p>
            </>
          ) : (
            <>
               <div className="flex justify-center p-1 min-h-[140px] items-center">
                 {(flags[0] || arms[0]) && (
                    <img 
                      src={flags[0] || arms[0]} 
                      alt={`Image of ${article.title}`} 
                      className="max-h-[220px] w-full object-contain border border-[#eaecf0] shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                 )}
               </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white border-b border-[#a2a9b1] mb-1 p-6 flex flex-col items-center justify-center text-[#a2a9b1]">
          {isLoading ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : (
            <Icon className="w-12 h-12 opacity-30" />
          )}
        </div>
      )}

      <table className="w-full border-collapse">
        <tbody>
          {article.infobox?.map((item, idx) => {
            if (item.label === '!HEADER!') {
              return (
                <tr key={idx} className="border-b border-[#eaecf0] last:border-0 align-top">
                  <th colSpan={2} className="px-2 py-1.5 text-center font-bold bg-[#eaecf0]/50 text-[#202122]">
                    {item.value}
                  </th>
                </tr>
              );
            }
            if (item.label === '!COLS!') {
              const cols = item.value.split(/\s*\|\|\s*/);
              return (
                <tr key={idx} className="border-b border-[#eaecf0] last:border-0 align-top">
                  <td colSpan={2} className="p-0">
                    <div className="flex w-full divide-x divide-[#eaecf0]">
                      {cols.map((col, cIdx) => (
                        <div key={cIdx} className="flex-1 px-2 py-1.5 whitespace-pre-wrap">{col}</div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            }
            return (
              <tr key={idx} className="border-b border-[#eaecf0] last:border-0 align-top">
                <th className="w-1/3 px-2 py-1.5 text-left font-bold bg-[#eaecf0]/50">
                  {item.label}
                </th>
                <td className="px-2 py-1.5 whitespace-pre-wrap">
                  {item.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </aside>
  );
}
