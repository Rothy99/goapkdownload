import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_APPS, INITIAL_REQUESTS } from './data/mockApps';
import { AppItem, AppCategory, ApkVersion, AppRequest, AppReview } from './types';
import { getStoredBookmarks, saveStoredBookmarks, getAppSlug, findAppBySlug } from './utils/helpers';

// Components
import { Header } from './components/Header';
import { CategoryPills } from './components/CategoryPills';
import { AppCard, AppCardSkeleton } from './components/AppCard';
import { AppDetailPage } from './components/AppDetailPage';
import { DownloadProgressModal } from './components/DownloadProgressModal';
import { QrCodeModal } from './components/QrCodeModal';
import { SubmitAppModal } from './components/SubmitAppModal';
import { RequestAppModal } from './components/RequestAppModal';
import { BookmarksModal } from './components/BookmarksModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { Footer } from './components/Footer';

import { 
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  // App catalogue state
  const [apps, setApps] = useState<AppItem[]>(() => {
    try {
      const saved = localStorage.getItem('apk_store_custom_apps');
      if (saved) {
        const custom = JSON.parse(saved);
        return [...custom, ...INITIAL_APPS];
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_APPS;
  });

  // App requests state
  const [requests, setRequests] = useState<AppRequest[]>(() => {
    try {
      const saved = localStorage.getItem('apk_store_requests');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REQUESTS;
  });

  // Category and Tag filters
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('All');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);

  // Briefly show skeleton screen on category/filter change to give smooth visual feedback
  useEffect(() => {
    setIsLoadingGrid(true);
    const timer = setTimeout(() => {
      setIsLoadingGrid(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, activeFilter]);

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => getStoredBookmarks());

  // Modal / Selected page state
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<{ app: AppItem; version?: ApkVersion } | null>(null);
  const [qrApp, setQrApp] = useState<AppItem | null>(null);

  // Modal Visibility
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Sync bookmarks to LocalStorage
  useEffect(() => {
    saveStoredBookmarks(bookmarkedIds);
  }, [bookmarkedIds]);

  // Sync routing for direct clean page navigation (/app/spotify-music-and-podcasts) & Admin route (/admin)
  useEffect(() => {
    const handleRouteCheck = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      // Check if URL or hash targets the Admin Portal
      if (pathname.endsWith('/admin') || pathname.endsWith('/admin/') || hash.includes('admin')) {
        setIsSubmitOpen(true);
        if (hash) {
          window.history.replaceState({}, '', '/admin');
        }
        return;
      }

      let routeSlug = '';

      // Check clean URL paths first (/app/slug, /apk/slug, /download/slug)
      if (pathname.includes('/app/')) {
        routeSlug = pathname.split('/app/')[1].split('/')[0];
      } else if (pathname.includes('/apk/')) {
        routeSlug = pathname.split('/apk/')[1].split('/')[0];
      } else if (pathname.includes('/download/')) {
        routeSlug = pathname.split('/download/')[1].split('/')[0];
      } 
      // Fallback & auto-convert legacy hash URLs (#/app/slug)
      else if (hash.startsWith('#/app/')) {
        routeSlug = hash.replace('#/app/', '').split('/')[0];
      } else if (hash.startsWith('#/apk/')) {
        routeSlug = hash.replace('#/apk/', '').split('/')[0];
      } else if (hash.startsWith('#/download/')) {
        routeSlug = hash.replace('#/download/', '').split('/')[0];
      }

      if (routeSlug) {
        const found = findAppBySlug(routeSlug, apps);
        if (found) {
          setSelectedApp(found);
          const cleanSlug = getAppSlug(found);
          if (hash || window.location.pathname !== `/app/${cleanSlug}`) {
            window.history.replaceState({}, '', `/app/${cleanSlug}`);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      // Default Home view: remove hash if present
      if (hash) {
        window.history.replaceState({}, '', '/');
      }
      if (pathname === '/' || pathname === '' || !routeSlug) {
        setSelectedApp(null);
      }
    };

    handleRouteCheck();
    window.addEventListener('popstate', handleRouteCheck);
    window.addEventListener('hashchange', handleRouteCheck);
    return () => {
      window.removeEventListener('popstate', handleRouteCheck);
      window.removeEventListener('hashchange', handleRouteCheck);
    };
  }, [apps]);

  // Handle navigating to app detail page with clean URL route (no '#')
  const handleSelectApp = (app: AppItem | null) => {
    setSelectedApp(app);
    if (app) {
      const slug = getAppSlug(app);
      const targetPath = `/app/${slug}`;
      if (window.location.pathname !== targetPath || window.location.hash) {
        window.history.pushState({}, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (window.location.pathname !== '/' || window.location.hash) {
        window.history.pushState({}, '', '/');
      }
    }
  };

  // Toggle bookmark handler
  const handleToggleBookmark = (appId: string) => {
    setBookmarkedIds((prev) => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  // Submit App handler
  const handleAddCustomApp = (newApp: AppItem) => {
    setApps((prev) => [newApp, ...prev]);
    try {
      const existingCustom = JSON.parse(localStorage.getItem('apk_store_custom_apps') || '[]');
      localStorage.setItem('apk_store_custom_apps', JSON.stringify([newApp, ...existingCustom]));
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Request handler
  const handleAddRequest = (reqData: Omit<AppRequest, 'id' | 'votes' | 'date' | 'status'>) => {
    const newReq: AppRequest = {
      ...reqData,
      id: `req-${Date.now()}`,
      votes: 1,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    const updated = [newReq, ...requests];
    setRequests(updated);
    try {
      localStorage.setItem('apk_store_requests', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Upvote Request
  const handleUpvoteRequest = (id: string) => {
    const updated = requests.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r);
    setRequests(updated);
    try {
      localStorage.setItem('apk_store_requests', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Add Review
  const handleAddReview = (appId: string, reviewData: Omit<AppReview, 'id' | 'date' | 'likes' | 'dislikes' | 'verifiedDownload'>) => {
    const newRev: AppReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      dislikes: 0,
      verifiedDownload: true
    };

    setApps((prevApps) => prevApps.map(a => {
      if (a.id === appId) {
        const updatedReviews = [newRev, ...a.reviews];
        const newTotal = a.totalReviews + 1;
        const newRating = Number(((a.rating * a.totalReviews + reviewData.rating) / newTotal).toFixed(1));
        return {
          ...a,
          reviews: updatedReviews,
          totalReviews: newTotal,
          rating: newRating
        };
      }
      return a;
    }));

    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp((prev) => prev ? {
        ...prev,
        reviews: [newRev, ...prev.reviews],
        totalReviews: prev.totalReviews + 1
      } : null);
    }
  };

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Category match
      if (selectedCategory !== 'All' && app.category !== selectedCategory) {
        return false;
      }
      // Top filter chip match
      if (activeFilter === 'verified' && !app.isVerified) return false;
      if (activeFilter === 'editors' && !app.isEditorChoice) return false;
      if (activeFilter === 'trending' && !app.isTrending) return false;
      
      return true;
    });
  }, [apps, selectedCategory, activeFilter]);

  // Featured apps for Hero banner
  const featuredApps = useMemo(() => {
    return apps.filter(a => a.isFeatured);
  }, [apps]);

  // Bookmarked Apps list
  const bookmarkedApps = useMemo(() => {
    return apps.filter(a => bookmarkedIds.includes(a.id));
  }, [apps, bookmarkedIds]);

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans selection:bg-emerald-500 selection:text-slate-950 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Header */}
      <Header
        apps={apps}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSelectApp={(app) => handleSelectApp(app)}
        onOpenSubmit={() => setIsSubmitOpen(true)}
        onOpenRequest={() => setIsRequestOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        bookmarkCount={bookmarkedIds.length}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleSelectApp(null);
        }}
      />

      {/* Main Page Layout */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-2.5 sm:pt-5 pb-8">
        
        {/* VIEW 1: FULL APP DETAILS PAGE */}
        {selectedApp ? (
          <AppDetailPage
            app={selectedApp}
            allApps={apps}
            onBack={() => handleSelectApp(null)}
            darkMode={darkMode}
            isBookmarked={bookmarkedIds.includes(selectedApp.id)}
            onToggleBookmark={handleToggleBookmark}
            onStartDownload={(app, version) => setDownloadTarget({ app, version })}
            onOpenQrCode={(app) => setQrApp(app)}
            onAddReview={handleAddReview}
            onSelectApp={(app) => handleSelectApp(app)}
          />
        ) : (
          /* VIEW 2: HOME CATALOGUE VIEW */
          <>
            {/* Site Intro Header */}
            <header className={`site-intro mb-3.5 p-4 sm:p-5 rounded-2xl border transition-colors ${
              darkMode 
                ? 'bg-slate-900/80 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
            }`}>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mb-1">
                Free APK Downloader - Safe APKPure &amp; LiteAPKs Alternative
              </h1>
              <h2 className={`text-xs sm:text-sm font-normal leading-relaxed ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Your trusted archive for 100% verified, malware-free original Android apps, unreleased developer betas, and premium modded games.
              </h2>
            </header>

            {/* Category & Tag Filters */}
            <CategoryPills
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              darkMode={darkMode}
            />

            {/* Section Heading */}
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <span>{selectedCategory === 'All' ? 'Latest APK Releases' : `${selectedCategory} Applications`}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {filteredApps.length}
                  </span>
                </h2>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Safe, direct-download Android application packages
                </p>
              </div>
            </div>

            {/* App Cards Grid */}
            {isLoadingGrid ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <AppCardSkeleton key={idx} darkMode={darkMode} />
                ))}
              </div>
            ) : filteredApps.length === 0 ? (
              <div className={`p-12 rounded-3xl border text-center space-y-3 ${
                darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="font-bold text-base">No APKs Found in this Category</h3>
                <p className="text-xs text-slate-400">Try switching filters or submit a new app to the catalog!</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setActiveFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
                {filteredApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    darkMode={darkMode}
                    isBookmarked={bookmarkedIds.includes(app.id)}
                    onSelectApp={(selected) => handleSelectApp(selected)}
                    onQuickDownload={(target) => handleSelectApp(target)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <Footer
        darkMode={darkMode}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        onOpenSubmit={() => setIsSubmitOpen(true)}
        onOpenRequest={() => setIsRequestOpen(true)}
      />

      {/* Modals & Utility Overlays */}

      {/* Download Progress Dialog */}
      {downloadTarget && (
        <DownloadProgressModal
          app={downloadTarget.app}
          version={downloadTarget.version}
          onClose={() => setDownloadTarget(null)}
          darkMode={darkMode}
          onOpenInstallGuide={() => {
            setDownloadTarget(null);
            setIsInstallGuideOpen(true);
          }}
        />
      )}

      {/* QR Code Modal for Phone Scan */}
      {qrApp && (
        <QrCodeModal
          app={qrApp}
          onClose={() => setQrApp(null)}
          darkMode={darkMode}
        />
      )}

      {/* Submit App Modal (Accessible via /admin or #/admin) */}
      {isSubmitOpen && (
        <SubmitAppModal
          onClose={() => {
            setIsSubmitOpen(false);
            if (window.location.hash.includes('admin')) {
              window.location.hash = '#/';
            } else if (window.location.pathname.toLowerCase().includes('admin')) {
              window.history.pushState(null, '', '/');
            }
          }}
          darkMode={darkMode}
          onSubmitApp={handleAddCustomApp}
        />
      )}

      {/* Request App Modal */}
      {isRequestOpen && (
        <RequestAppModal
          requests={requests}
          onClose={() => setIsRequestOpen(false)}
          darkMode={darkMode}
          onRequestSubmit={handleAddRequest}
          onUpvoteRequest={handleUpvoteRequest}
        />
      )}

      {/* Bookmarks Saved Apps Drawer */}
      {isBookmarksOpen && (
        <BookmarksModal
          bookmarkedApps={bookmarkedApps}
          onClose={() => setIsBookmarksOpen(false)}
          darkMode={darkMode}
          onSelectApp={(app) => {
            setIsBookmarksOpen(false);
            handleSelectApp(app);
          }}
          onRemoveBookmark={handleToggleBookmark}
          onStartDownload={(app) => {
            setIsBookmarksOpen(false);
            handleSelectApp(app);
          }}
        />
      )}

      {/* Install Guide Modal */}
      {isInstallGuideOpen && (
        <InstallGuideModal
          onClose={() => setIsInstallGuideOpen(false)}
          darkMode={darkMode}
        />
      )}

    </div>
  );
}

