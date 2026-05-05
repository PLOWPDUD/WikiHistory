
import { useState } from 'react';
import { Search, Menu, Globe, User, LogIn, LogOut, Plus, X, History, Info, Newspaper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface WikiHeaderProps {
  onSearch: (query: string) => void;
  onNavigate: (view: any) => void;
  currentView: string;
}

export default function WikiHeader({ onSearch, onNavigate, currentView }: WikiHeaderProps) {
  const { user, login, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-[#a2a9b1] bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-[#3366cc] flex items-center justify-center rounded-sm">
              <Globe className="text-white w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-xl tracking-tight leading-none text-[#202122]">WikiHistory</span>
              <p className="text-[10px] text-[#54595d] -mt-1 leading-none uppercase tracking-widest font-sans">The Alt-History Encyclopedia</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-4 text-sm">
            <button 
              onClick={() => onNavigate('home')}
              className={cn(
                "hover:text-[#3366cc] border-b-2 border-transparent pb-1 transition-colors",
                currentView === 'home' && "border-[#3366cc] text-[#3366cc]"
              )}
            >
              Main Page
            </button>
            <button 
              onClick={() => onNavigate('create')}
              className={cn(
                "hover:text-[#3366cc] border-b-2 border-transparent pb-1 transition-colors flex items-center gap-1",
                currentView === 'create' && "border-[#3366cc] text-[#3366cc]"
              )}
            >
              <Plus className="w-3 h-3" />
              Create Article
            </button>
          </nav>
        </div>

        <div className="flex-1 max-w-xl mx-8 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#54595d] group-focus-within:text-[#3366cc]" />
            <input
              type="text"
              placeholder="Search WikiHistory"
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc] transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <button 
                  onClick={() => onNavigate('account-settings')}
                  className="text-xs font-medium text-[#202122] hover:text-[#3366cc] block w-full text-right"
                >
                  {user.displayName || (user.isAnonymous ? 'Guest' : 'User')}
                </button>
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => onNavigate('account-settings')} className="text-[10px] text-[#3366cc] hover:underline">Settings</button>
                  <span className="text-[10px] text-[#a2a9b1]">|</span>
                  <button onClick={logout} className="text-[10px] text-[#3366cc] hover:underline flex items-center gap-1">
                    <LogOut className="w-2 h-2" />
                    Log out
                  </button>
                </div>
              </div>
              <button onClick={() => onNavigate('account-settings')}>
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-[#a2a9b1] hover:border-[#3366cc] transition-colors"
                  referrerPolicy="no-referrer"
                />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onNavigate('login')}
              className="flex items-center gap-2 text-sm text-[#3366cc] hover:underline font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Log in</span>
            </button>
          )}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 text-[#54595d] hover:bg-[#f8f9fa] rounded-sm transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-b border-[#a2a9b1] shadow-xl animate-in slide-in-from-top duration-200">
          <div className="px-4 py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#54595d]" />
              <input
                type="text"
                placeholder="Search WikiHistory"
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm py-2 pl-10 pr-4 text-sm"
              />
            </div>
            
            <nav className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { onNavigate('home'); setIsMenuOpen(false); }}
                className="flex items-center gap-2 p-3 bg-[#f8f9fa] rounded-sm text-sm font-bold border border-[#eaecf0]"
              >
                <Globe className="w-4 h-4 text-[#3366cc]" /> Main Page
              </button>
              <button 
                onClick={() => { onNavigate('create'); setIsMenuOpen(false); }}
                className="flex items-center gap-2 p-3 bg-[#f8f9fa] rounded-sm text-sm font-bold border border-[#eaecf0]"
              >
                <Plus className="w-4 h-4 text-[#3366cc]" /> Create
              </button>
              <button 
                onClick={() => { onNavigate('recent-changes'); setIsMenuOpen(false); }}
                className="flex items-center gap-2 p-3 bg-[#f8f9fa] rounded-sm text-sm font-bold border border-[#eaecf0]"
              >
                <History className="w-4 h-4 text-[#3366cc]" /> Recent
              </button>
              <button 
                onClick={() => { onNavigate('contents'); setIsMenuOpen(false); }}
                className="flex items-center gap-2 p-3 bg-[#f8f9fa] rounded-sm text-sm font-bold border border-[#eaecf0]"
              >
                <Newspaper className="w-4 h-4 text-[#3366cc]" /> Contents
              </button>
            </nav>

            <div className="pt-4 border-t border-[#eaecf0]">
               <button 
                onClick={() => { onNavigate('about'); setIsMenuOpen(false); }}
                className="flex items-center gap-2 text-sm text-[#54595d] hover:text-[#3366cc]"
              >
                <Info className="w-4 h-4" /> About WikiHistory
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
