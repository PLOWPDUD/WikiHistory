
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import WikiHeader from './components/WikiHeader';
import Home from './components/Home';
import CreateArticle from './components/CreateArticle';
import ArticleView from './components/ArticleView';
import MyContributions from './components/MyContributions';
import RecentChanges from './components/RecentChanges';
import StaticPage from './components/StaticPage';
import Login from './components/Login';
import AccountSettings from './components/AccountSettings';
import { useAuth } from './context/AuthContext';
import { Article } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';

type ViewState = 'home' | 'create' | 'article' | 'search' | 'my-contributions' | 'recent-changes' | 'contents' | 'current-events' | 'about' | 'community' | 'donate' | 'login' | 'account-settings';

function WikiApp() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<ViewState>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleWikiNavigate = (e: any) => {
      navigateTo(e.detail as ViewState);
    };
    window.addEventListener('wiki-navigate', handleWikiNavigate);
    return () => window.removeEventListener('wiki-navigate', handleWikiNavigate);
  }, []);

  const navigateTo = (newView: ViewState, article?: Article) => {
    if (article) {
      setSelectedArticle(article);
    } else if (newView === 'create' || newView === 'home' || newView === 'search' || newView === 'my-contributions') {
      setSelectedArticle(null);
    }
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePermanentLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Permanent link copied to clipboard!');
  };

  const handlePageInfo = () => {
    if (selectedArticle) {
       alert(`Page Info:\nTitle: ${selectedArticle.title}\nID: ${selectedArticle.id}\nCreated: ${new Date(selectedArticle.createdAt).toLocaleString()}\nType: ${selectedArticle.type}`);
    } else {
       alert('No article selected.');
    }
  };

  const handleRandom = async () => {
    // Basic random logic for prototype: get recent articles and pick one
    const path = 'articles';
    try {
      const q = query(collection(db, path), limit(20));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docs = snap.docs;
        const randomDoc = docs[Math.floor(Math.random() * docs.length)];
        navigateTo('article', { id: randomDoc.id, ...randomDoc.data() } as Article);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-white text-[#202122] font-sans flex flex-col">
      <WikiHeader 
        onSearch={(q) => { setSearchQuery(q); navigateTo('search'); }} 
        onNavigate={(v) => navigateTo(v as ViewState)} 
        currentView={view}
      />
      
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Left Sidebar - Traditional Wiki Style */}
        <aside className={cn(
          "hidden lg:block w-44 pt-8 px-4 border-r border-[#a2a9b1] bg-[#f6f6f6]/30",
          !isSidebarOpen && "w-10 overflow-hidden",
          view === 'account-settings' && "hidden"
        )}>
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-[12px] font-bold text-[#54595d] uppercase tracking-tighter border-b border-[#a2a9b1] pb-1">Navigation</h4>
              <ul className="text-[13px] space-y-1">
                <li><button onClick={() => navigateTo('home')} className={cn("text-[#3366cc] hover:underline block text-left w-full", view === 'home' && "font-bold text-[#202122] no-underline")}>Main page</button></li>
                <li><button onClick={() => navigateTo('contents')} className={cn("text-[#3366cc] hover:underline block text-left w-full", view === 'contents' && "font-bold text-[#202122] no-underline")}>Contents</button></li>
                <li><button onClick={() => navigateTo('current-events')} className={cn("text-[#3366cc] hover:underline block text-left w-full", view === 'current-events' && "font-bold text-[#202122] no-underline")}>Current events</button></li>
                <li><button onClick={handleRandom} className="text-[#3366cc] hover:underline block text-left w-full">Random article</button></li>
                <li><button onClick={() => navigateTo('about')} className={cn("text-[#3366cc] hover:underline block text-left w-full", view === 'about' && "font-bold text-[#202122] no-underline")}>About WikiHistory</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-[12px] font-bold text-[#54595d] uppercase tracking-tighter border-b border-[#a2a9b1] pb-1">Contribute</h4>
              <ul className="text-[13px] space-y-1">
                <li><button onClick={() => navigateTo('create')} className={cn("text-[#3366cc] hover:underline block text-left w-full", view === 'create' && "font-bold text-[#202122] no-underline")}>Create entry</button></li>
                <li><button onClick={() => navigateTo('my-contributions')} className={cn("text-[#3366cc] hover:underline block text-left w-full", view === 'my-contributions' && "font-bold text-[#202122] no-underline")}>My contributions</button></li>
                <li><button onClick={() => navigateTo('community')} className={cn("text-[#3366cc] hover:underline block text-left w-full", view === 'community' && "font-bold text-[#202122] no-underline")}>Community portal</button></li>
                <li><button onClick={() => navigateTo('recent-changes')} className={cn("text-[#3366cc] hover:underline block text-left w-full", view === 'recent-changes' && "font-bold text-[#202122] no-underline")}>Recent changes</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-[12px] font-bold text-[#54595d] uppercase tracking-tighter border-b border-[#a2a9b1] pb-1">Tools</h4>
              <ul className="text-[13px] space-y-1">
                <li><button onClick={() => alert('Search engines across the multiverse are indexing this page...')} className="text-[#3366cc] hover:underline block text-left w-full">What links here</button></li>
                <li><button onClick={() => navigateTo('recent-changes')} className="text-[#3366cc] hover:underline block text-left w-full">Related changes</button></li>
                <li><button onClick={() => navigateTo('contents')} className="text-[#3366cc] hover:underline block text-left w-full">Special pages</button></li>
                <li><button onClick={handlePermanentLink} className="text-[#3366cc] hover:underline block text-left w-full">Permanent link</button></li>
                <li><button onClick={handlePageInfo} className="text-[#3366cc] hover:underline block text-left w-full">Page information</button></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 bg-white">
          <main className={cn("pb-20", view === 'account-settings' && "max-w-full")}>
            <AnimatePresence mode="wait">
              <motion.div
                key={view + (selectedArticle?.id || '')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {view === 'account-settings' && (
                  <AccountSettings onBack={() => navigateTo('home')} />
                )}
                {view === 'home' && (
                  <Home 
                    onSelectArticle={(a) => navigateTo('article', a)} 
                    onRandomArticle={handleRandom}
                    onNavigate={(v) => navigateTo(v)}
                    searchQuery={searchQuery}
                  />
                )}
                
                {view === 'search' && (
                  <Home 
                    onSelectArticle={(a) => navigateTo('article', a)} 
                    onRandomArticle={handleRandom}
                    onNavigate={(v) => navigateTo(v)}
                    searchQuery={searchQuery}
                    isSearchView
                  />
                )}
                
                {view === 'create' && (
                  <CreateArticle 
                    onCreated={(a) => navigateTo('article', a)} 
                    initialArticle={selectedArticle || undefined}
                  />
                )}
                
                {view === 'article' && selectedArticle && (
                  <ArticleView 
                    article={selectedArticle} 
                    onEdit={(a) => navigateTo('create', a)}
                  />
                )}

                {view === 'my-contributions' && (
                  <MyContributions 
                    onSelectArticle={(a) => navigateTo('article', a)} 
                    onEditArticle={(a) => navigateTo('create', a)}
                  />
                )}

                {view === 'recent-changes' && (
                  <RecentChanges 
                    onSelectArticle={(a) => navigateTo('article', a)} 
                  />
                )}

                {['about', 'community', 'contents', 'current-events', 'donate'].includes(view) && (
                  <StaticPage type={view as any} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <footer className="bg-white border-t border-[#a2a9b1] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm text-[#54595d]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#3366cc] flex items-center justify-center rounded-sm">
                <span className="text-white text-[10px] font-bold">W</span>
              </div>
              <span className="font-serif text-lg font-bold">WikiHistory</span>
            </div>
            <p>Empowering humanity to explore every possible timeline through the collaborative draft of AI-generated history.</p>
          </div>
          <div>
            <h4 className="font-bold text-[#202122] mb-4">WikiHistory Network</h4>
            <ul className="space-y-2">
              <li><button className="hover:underline">Meta-Wiki</button></li>
              <li><button className="hover:underline">WikiData (Fictional)</button></li>
              <li><button className="hover:underline">WikiQuote (Prophecies)</button></li>
              <li><button className="hover:underline">WikiDictionary</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#202122] mb-4">Foundation</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigateTo('donate')} className="hover:underline">Donate</button></li>
              <li><button className="hover:underline">Privacy Policy</button></li>
              <li><button onClick={() => navigateTo('about')} className="hover:underline">About WikiHistory</button></li>
              <li><button className="hover:underline">Disclaimers</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-[#eaecf0] text-center text-xs opacity-60">
          <p>© 2026 WikiHistory Foundation. All multiverses observed.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WikiApp />
    </AuthProvider>
  );
}
