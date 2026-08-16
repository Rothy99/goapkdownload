import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Logo } from './Logo';
import { 
  Search, 
  Download, 
  MessageSquarePlus, 
  Sun, 
  Moon, 
  ShieldCheck, 
  X, 
  ChevronRight,
  HelpCircle,
  Menu,
  ArrowLeft,
  Cloud
} from 'lucide-react';
import { AppItem, AppCategory } from '../types';

interface HeaderProps {
  apps: AppItem[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onSelectApp: (app: AppItem) => void;
  onOpenSubmit: () => void;
  onOpenRequest: () => void;
  onOpenBookmarks?: () => void;
  onOpenInstallGuide: () => void;
  bookmarkCount?: number;
  selectedCategory: AppCategory;
  onSelectCategory: (cat: AppCategory) => void;
}

export const Header: React.FC<HeaderProps> = ({
  apps,
  darkMode,
  setDarkMode,
  onSelectApp,
  onOpenSubmit,
  onOpenRequest,
  onOpenBookmarks,
  onOpenInstallGuide,
  bookmarkCount = 0,
  selectedCategory,
  onSelectCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const filteredApps = searchQuery.trim() === ''
    ? []
    : apps.filter(app =>
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6);

  const recommendedApps = useMemo(() => {
    const trending = apps.filter(app => app.isTrending || app.isFeatured || app.rating >= 4.8);
    return trending.length > 0 ? trending.slice(0, 5) : apps.slice(0, 5);
  }, [apps]);

  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isMobileSearchActive && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [isMobileSearchActive]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredApps.length > 0) {
      onSelectApp(filteredApps[0]);
      setIsSearchOpen(false);
      setIsMobileSearchActive(false);
      setSearchQuery('');
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b backdrop-blur-md relative ${
      darkMode 
        ? 'bg-slate-900/95 border-slate-800 text-slate-100' 
        : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => {
              onSelectCategory('All');
              setIsMobileMenuOpen(false);
            }} 
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group select-none flex-shrink-0"
          >
            <Logo size={40} className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform duration-300 drop-shadow-md" />
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className={`font-black text-base sm:text-xl tracking-tight bg-clip-text text-transparent ${
                  darkMode 
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400' 
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
                }`}>
                  GoAPKDownload
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/30">
                  SAFE
                </span>
              </div>
              <p className={`text-[10px] font-medium hidden sm:block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                100% Verified Direct APK Downloads
              </p>
            </div>
          </div>

          {/* Desktop Inline Search Bar */}
          <div ref={searchRef} className="hidden sm:block relative flex-1 max-w-xl mx-3">
            <form 
              onSubmit={handleSearchSubmit}
              className={`relative flex items-center rounded-xl border transition-all ${
                darkMode 
                  ? 'bg-slate-800/80 border-slate-700/80 focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 text-slate-100' 
                  : 'bg-slate-100 border-slate-200/90 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 text-slate-900 shadow-xs'
              }`}
            >
              <button
                type="submit"
                title="Search APKs"
                className="p-2 ml-1 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="Search apps, games, packages..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full py-2.5 px-2 bg-transparent text-xs sm:text-sm outline-none placeholder:text-slate-400 min-w-0"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 mr-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Desktop Autocomplete Dropdown */}
            {isSearchOpen && (
              <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden z-50 max-h-[70vh] overflow-y-auto touch-pan-y ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                {searchQuery.trim() === '' ? (
                  <>
                    <div className={`p-2.5 text-[11px] font-bold tracking-wider uppercase border-b ${
                      darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}>
                      🔥 Popular Searches
                    </div>
                    <div className="divide-y divide-slate-700/30">
                      {recommendedApps.map((app) => (
                        <div
                          key={app.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            onSelectApp(app);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <img 
                            src={app.icon} 
                            alt={app.title} 
                            className="w-10 h-10 rounded-xl object-cover shadow-xs flex-shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold truncate">{app.title}</h4>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-2">{app.size}</span>
                            </div>
                            <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {app.developer} • {app.category}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : filteredApps.length > 0 ? (
                  <>
                    <div className={`p-2.5 text-[11px] font-bold tracking-wider uppercase border-b ${
                      darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}>
                      Matching Applications ({filteredApps.length})
                    </div>
                    <div className="divide-y divide-slate-700/30">
                      {filteredApps.map((app) => (
                        <div
                          key={app.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            onSelectApp(app);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <img 
                            src={app.icon} 
                            alt={app.title} 
                            className="w-10 h-10 rounded-xl object-cover shadow-xs flex-shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold truncate">{app.title}</h4>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-2">{app.size}</span>
                            </div>
                            <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {app.developer} • {app.category}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center">
                    <p className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      No APKs found matching "{searchQuery}"
                    </p>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                        onOpenRequest();
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-xs active:scale-95 transition-transform"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      <span>Request this APK</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Mobile Search Icon Button Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchActive(true);
                setIsSearchOpen(true);
              }}
              title="Search APKs"
              className={`sm:hidden h-10 w-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer shrink-0 ${
                darkMode 
                  ? 'border-slate-700 bg-slate-800 text-emerald-400 hover:bg-slate-700' 
                  : 'border-slate-200 bg-slate-100/80 text-emerald-600 hover:bg-slate-200/80'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Desktop Actions */}
            <button
              onClick={onOpenInstallGuide}
              title="APK Installation Guide"
              className={`hidden md:flex items-center gap-1.5 px-3.5 h-10 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                darkMode 
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200' 
                  : 'border-slate-200 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              <span>Guide</span>
            </button>

            <button
              onClick={onOpenRequest}
              title="Request an APK"
              className={`hidden md:flex items-center gap-1.5 px-3.5 h-10 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                darkMode 
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200' 
                  : 'border-slate-200 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4 text-teal-500" />
              <span>Request APK</span>
            </button>

            {/* Dark Mode Toggle Button (Desktop) */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Dark/Light Mode"
              className={`hidden md:flex h-10 w-10 items-center justify-center rounded-xl border transition-all cursor-pointer shrink-0 ${
                darkMode 
                  ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700' 
                  : 'border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Open Navigation Menu"
              className={`md:hidden h-10 w-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer shrink-0 ${
                darkMode 
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' 
                  : 'border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Full-Width Search Header Overlay */}
        {isMobileSearchActive && (
          <div className={`absolute inset-0 z-50 flex items-center px-3 sm:px-4 gap-2 ${
            darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
          }`}>
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchActive(false);
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-2 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer shrink-0"
              title="Close Search"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-500" />
            </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Search apps, games, packages..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className={`w-full py-2 px-3 pr-8 rounded-xl border text-sm outline-none ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 focus:border-emerald-500 text-slate-100 placeholder:text-slate-500' 
                    : 'bg-slate-100 border-slate-200 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Mobile Search Dropdown Results */}
            {isMobileSearchActive && (
              <div className={`absolute top-full left-0 right-0 shadow-2xl border-b border-x overflow-hidden z-50 max-h-[75vh] overflow-y-auto touch-pan-y ${
                darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                {searchQuery.trim() === '' ? (
                  <>
                    <div className={`p-3 text-[11px] font-bold tracking-wider uppercase border-b ${
                      darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}>
                      🔥 Popular Searches
                    </div>
                    <div className="divide-y divide-slate-700/30">
                      {recommendedApps.map((app) => (
                        <div
                          key={app.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            onSelectApp(app);
                            setIsMobileSearchActive(false);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors active:bg-emerald-500/10 ${
                            darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                          }`}
                        >
                          <img 
                            src={app.icon} 
                            alt={app.title} 
                            className="w-11 h-11 rounded-xl object-cover shadow-xs shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold truncate">{app.title}</h4>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold ml-2 shrink-0">{app.size}</span>
                            </div>
                            <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {app.developer} • {app.category}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : filteredApps.length > 0 ? (
                  <>
                    <div className={`p-3 text-[11px] font-bold tracking-wider uppercase border-b ${
                      darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}>
                      Matching Applications ({filteredApps.length})
                    </div>
                    <div className="divide-y divide-slate-700/30">
                      {filteredApps.map((app) => (
                        <div
                          key={app.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            onSelectApp(app);
                            setIsMobileSearchActive(false);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors active:bg-emerald-500/10 ${
                            darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                          }`}
                        >
                          <img 
                            src={app.icon} 
                            alt={app.title} 
                            className="w-11 h-11 rounded-xl object-cover shadow-xs shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold truncate">{app.title}</h4>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold ml-2 shrink-0">{app.size}</span>
                            </div>
                            <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {app.developer} • {app.category}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-5 text-center">
                    <p className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      No APKs found matching "{searchQuery}"
                    </p>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setIsMobileSearchActive(false);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                        onOpenRequest();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-xs active:scale-95 transition-transform"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                      <span>Request this APK</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Responsive Hamburger Drawer */}
        {isMobileMenuOpen && (
          <div className={`md:hidden py-4 px-2 border-t mt-1 space-y-2 animate-in slide-in-from-top-2 ${
            darkMode ? 'border-slate-800 text-slate-100' : 'border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => {
                onOpenInstallGuide();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              <span>APK Installation Guide</span>
            </button>

            <button
              onClick={() => {
                onOpenRequest();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4 text-teal-500" />
              <span>Request APK</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {darkMode ? 'Switch to Light' : 'Switch to Dark'}
              </span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};


