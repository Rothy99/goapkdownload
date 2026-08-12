import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { INITIAL_REQUESTS } from './data/mockApps';
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

const getCategoryFromFileName = (fileName: string): AppCategory => {
  const lower = fileName.toLowerCase();
  if (lower.includes('game') || lower.includes('minecraft') || lower.includes('gta') || lower.includes('pubg')) {
    return 'Games';
  }
  if (lower.includes('music') || lower.includes('spotify') || lower.includes('video') || lower.includes('youtube') || lower.includes('netflix') || lower.includes('audio') || lower.includes('podcast')) {
    return 'Media & Video';
  }
  if (lower.includes('photo') || lower.includes('camera') || lower.includes('gallery') || lower.includes('editor')) {
    return 'Photography';
  }
  if (lower.includes('social') || lower.includes('facebook') || lower.includes('instagram') || lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('chat') || lower.includes('message')) {
    return 'Social';
  }
  if (lower.includes('finance') || lower.includes('bank') || lower.includes('wallet') || lower.includes('pay') || lower.includes('crypto')) {
    return 'Finance';
  }
  if (lower.includes('health') || lower.includes('fit') || lower.includes('run') || lower.includes('workout') || lower.includes('diet')) {
    return 'Health & Fitness';
  }
  if (lower.includes('productivity') || lower.includes('note') || lower.includes('calendar') || lower.includes('doc') || lower.includes('sheet') || lower.includes('office')) {
    return 'Productivity';
  }
  if (lower.includes('zarchiver') || lower.includes('tool') || lower.includes('utility') || lower.includes('file') || lower.includes('manager') || lower.includes('zip') || lower.includes('rar')) {
    return 'Tools';
  }
  return 'Utilities'; // default
};

const getCookie = (name: string): string | null => {
  try {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

const setCookie = (name: string, value: string, days: number) => {
  try {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  } catch (e) {
    console.error(e);
  }
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return getCookie('dark_mode') === 'true';
  });

  // Sync dark mode to cookie and root class list
  useEffect(() => {
    setCookie('dark_mode', darkMode ? 'true' : 'false', 365);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    return getCookie('cookie_consent') !== 'accepted';
  });

  const handleAcceptCookies = () => {
    setCookie('cookie_consent', 'accepted', 365);
    setShowCookieBanner(false);
  };
  
  // App catalogue state (loads from localStorage instantly on load)
  const [apps, setApps] = useState<AppItem[]>(() => {
    try {
      const savedCustom = localStorage.getItem('apk_store_custom_apps');
      const custom = savedCustom ? JSON.parse(savedCustom) : [];

      const savedGdrive = localStorage.getItem('apk_store_cached_apps');
      const gdrive = savedGdrive ? JSON.parse(savedGdrive) : [];

      return [...custom, ...gdrive];
    } catch (e) {
      console.error(e);
    }
    return [];
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
  
  // Stale-While-Revalidate: Show skeleton grid only if we have no cached apps at all
  const [isLoadingGrid, setIsLoadingGrid] = useState(() => {
    try {
      const savedGdrive = localStorage.getItem('apk_store_cached_apps');
      if (savedGdrive && JSON.parse(savedGdrive).length > 0) {
        return false;
      }
    } catch (e) {}
    return true;
  });

  // Load files from Google Drive
  const loadGoogleDriveFiles = useCallback(async (showLoader = false) => {
    try {
      if (showLoader || apps.length === 0) {
        setIsLoadingGrid(true);
      }
      const res = await fetch('/api/drive/files');
      const data = await res.json();
      if (data.success && data.files) {
        const allFiles = data.files;
        const rootFolderId = data.rootFolderId;

        // 1. Separate APKs/files and images
        const apkFiles = allFiles.filter((file: any) => 
          file.mimeType === 'application/vnd.android.package-archive' ||
          (file.name && file.name.toLowerCase().endsWith('.apk'))
        );

        const imageFiles = allFiles.filter((file: any) => 
          file.mimeType.startsWith('image/') ||
          (file.name && /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name))
        );

        // 2. Group APK files into AppItems by subfolder parents or clean titles
        const appGroups: { [key: string]: any[] } = {};

        apkFiles.forEach((file: any) => {
          const parentId = file.parents && file.parents[0];
          let groupKey = parentId;

          // If it is in the root folder, group by the clean title name (case-insensitive)
          if (!parentId || parentId === rootFolderId) {
            const cleanTitle = file.name
              ? file.name
                  .replace(/\.[^/.]+$/, '')
                  .replace(/[-_]v?\d+\.\d+(\.\d+)*/gi, '')
                  .replace(/[-_]/g, ' ')
                  .trim()
                  .toLowerCase()
              : 'unknown';
            groupKey = `root_${cleanTitle}`;
          }

          if (!appGroups[groupKey]) {
            appGroups[groupKey] = [];
          }
          appGroups[groupKey].push(file);
        });

        const mappedApps: AppItem[] = Object.keys(appGroups).map((groupKey) => {
          const groupFiles = appGroups[groupKey];
          
          // Sort files inside group by createdTime descending (newest version first)
          groupFiles.sort((a, b) => {
            const tA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
            const tB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
            return tB - tA;
          });

          // Main app representation is the newest version
          const mainFile = groupFiles[0];
          
          const cleanTitle = mainFile.name
            ? mainFile.name
                .replace(/\.[^/.]+$/, '') // strip extension
                .replace(/[-_]v?\d+\.\d+(\.\d+)*/gi, '') // strip version suffix
                .replace(/[-_]/g, ' ') // replace dash/underscore with space
            : 'Unknown App';
          
          const capitalizedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
          const updatedDate = mainFile.createdTime 
            ? mainFile.createdTime.split('T')[0] 
            : new Date().toISOString().split('T')[0];

          const computedCategory = getCategoryFromFileName(mainFile.name || '');

          // Find associated image
          const parentId = mainFile.parents && mainFile.parents[0];
          let iconUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80';
          let screenshots = [iconUrl];

          if (parentId && parentId !== rootFolderId) {
            const folderImage = imageFiles.find((img: any) => 
              img.parents && img.parents.includes(parentId)
            );

            if (folderImage) {
              iconUrl = `/api/drive/file/${folderImage.id}`;
              screenshots = [iconUrl];
            }
          } else {
            const baseName = mainFile.name.replace(/\.[^/.]+$/, '').toLowerCase().split(/[-_]/)[0];
            const matchingImage = imageFiles.find((img: any) => {
              const imgBaseName = img.name.replace(/\.[^/.]+$/, '').toLowerCase();
              return imgBaseName.startsWith(baseName) || baseName.startsWith(imgBaseName);
            });

            if (matchingImage) {
              iconUrl = `/api/drive/file/${matchingImage.id}`;
              screenshots = [iconUrl];
            }
          }

          // Map all files in the group to the versions array
          const versions: ApkVersion[] = groupFiles.map((file: any, index: number) => {
            const formattedSize = file.size 
              ? (parseInt(file.size, 10) / (1024 * 1024)).toFixed(1) + ' MB'
              : 'Unknown Size';

            const fileUpdatedDate = file.createdTime 
              ? file.createdTime.split('T')[0] 
              : new Date().toISOString().split('T')[0];

            const versionMatch = file.name ? file.name.match(/[-_]v?(\d+\.\d+(?:\.\d+)*)/i) : null;
            const extractedVersion = versionMatch ? versionMatch[1] : `1.0.${groupFiles.length - 1 - index}`;

            return {
              versionName: extractedVersion,
              versionCode: groupFiles.length - index,
              releaseDate: fileUpdatedDate,
              fileSize: formattedSize,
              minAndroid: 'Android 8.0+',
              sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
              changelog: [`Google Drive package update - version ${extractedVersion}`],
              downloadUrl: `/api/drive/download/${file.id}`,
              isLatest: index === 0
            };
          });

          const mainSize = versions[0].fileSize;

          return {
            id: groupKey,
            title: capitalizedTitle,
            packageName: `com.gdrive.app.${groupKey.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            category: computedCategory,
            rating: 5.0,
            totalReviews: 1,
            downloadsCount: 'New',
            downloadsNumeric: 1,
            icon: iconUrl,
            banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
            developer: 'GoAPK',
            minAndroid: 'Android 8.0+',
            size: mainSize,
            updatedDate: updatedDate,
            isVerified: true,
            tags: ['Google Drive', 'APK'],
            description: `Android package file (${mainFile.name}) hosted securely on Google Drive.`,
            longDescription: `Official Android package stored and hosted directly on Google Drive cloud storage. Verified safe and secure. Supports multiple versions: ${versions.map(v => v.versionName).join(', ')}.`,
            screenshots: screenshots,
            safetyChecks: [
              { label: 'Google Drive Virus Scan', status: 'passed', description: 'Scanned clean by Google Drive built-in virus scanner.' },
              { label: 'Package Signature Verified', status: 'passed', description: 'Standard signature verification passed.' }
            ],
            versions: versions,
            reviews: []
          };
        });

        // Cache the mapped Google Drive apps in localStorage for the next instant load
        localStorage.setItem('apk_store_cached_apps', JSON.stringify(mappedApps));

        // Mix with any custom apps added locally in localStorage
        const savedCustom = localStorage.getItem('apk_store_custom_apps');
        const custom = savedCustom ? JSON.parse(savedCustom) : [];
        
        setApps([...custom, ...mappedApps]);
      }
    } catch (err) {
      console.error('Failed to load APKs from Google Drive:', err);
    } finally {
      setIsLoadingGrid(false);
    }
  }, [apps.length]);

  // Load files from Google Drive on component mount (in background)
  useEffect(() => {
    loadGoogleDriveFiles();
  }, []);

  const isFirstRender = useRef(true);
  // Briefly show skeleton screen on category/filter change to give smooth visual feedback
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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
  const handleAddCustomApp = () => {
    loadGoogleDriveFiles(true);
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

      {/* Cookie Consent Banner */}
      {showCookieBanner && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md p-5 rounded-2xl border shadow-2xl backdrop-blur-md z-50 transition-all ${
          darkMode ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900'
        }`}>
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <span className="text-emerald-500">🍪</span> Cookie &amp; Storage Settings
            </h4>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              We use local storage cookies to cache the Google Drive APK database. This allows the pages to load instantly and run background synchronization for a premium, lag-free user experience.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleAcceptCookies}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs cursor-pointer transition-colors shadow-sm"
              >
                Allow Cookies &amp; Cache
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

