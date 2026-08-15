import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  HardDrive, 
  Calendar, 
  QrCode, 
  History, 
  MessageSquare, 
  Share2, 
  Sparkles,
  Maximize2,
  Cloud
} from 'lucide-react';
import { AppItem, ApkVersion, AppReview } from '../types';

interface AppDetailPageProps {
  app: AppItem;
  allApps?: AppItem[];
  onBack: () => void;
  darkMode: boolean;
  isBookmarked: boolean;
  onToggleBookmark: (appId: string) => void;
  onStartDownload: (app: AppItem, version?: ApkVersion) => void;
  onOpenQrCode: (app: AppItem) => void;
  onAddReview: (appId: string, review: Omit<AppReview, 'id' | 'date' | 'likes' | 'dislikes' | 'verifiedDownload'>) => void;
  onSelectApp?: (app: AppItem) => void;
}

export const AppDetailPage: React.FC<AppDetailPageProps> = ({
  app,
  allApps = [],
  onBack,
  darkMode,
  isBookmarked,
  onToggleBookmark,
  onStartDownload,
  onOpenQrCode,
  onAddReview,
  onSelectApp
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'versions' | 'reviews' | 'security'>('about');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [failedScreenshots, setFailedScreenshots] = useState<Record<string, boolean>>({});

  const handleScreenshotError = (imgUrl: string) => {
    setFailedScreenshots((prev) => ({ ...prev, [imgUrl]: true }));
  };

  // Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Scroll to top when app changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [app.id]);

  // Compute similar apps in the same category
  const similarApps = useMemo(() => {
    if (!app || !allApps) return [];
    const inSameCategory = allApps.filter(
      (a) => a.category === app.category && a.id !== app.id
    );
    if (inSameCategory.length > 0) {
      return inSameCategory.slice(0, 4);
    }
    return allApps.filter((a) => a.id !== app.id).slice(0, 4);
  }, [allApps, app]);

  const latestVersionStr = app.versions?.find(v => v.isLatest)?.versionName || app.versions?.[0]?.versionName || '1.0.0';
  const formattedVersion = latestVersionStr.toLowerCase().startsWith('v') ? latestVersionStr : `v${latestVersionStr}`;
  const pageTitleTemplate = `${app.title} APK Download ${formattedVersion} (Safe & Original) for Android`;
  const pageMetaDescriptionTemplate = `Download the latest ${app.title} ${formattedVersion} APK for Android free. 100% verified, malware-free alternative with direct links.`;

  // Dynamically set page title, meta description, robots, canonical and JSON-LD schema
  useEffect(() => {
    const previousTitle = document.title;
    document.title = pageTitleTemplate;

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    const previousDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageMetaDescriptionTemplate);

    // Robots Tag
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'index, follow');

    // Canonical Tag
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    const canonicalUrl = `${window.location.origin}/app/${app.slug}`;
    linkCanonical.setAttribute('href', canonicalUrl);

    // JSON-LD Schema
    const schemaId = 'seo-json-ld';
    let scriptEl = document.getElementById(schemaId);
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.setAttribute('id', schemaId);
      scriptEl.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptEl);
    }
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      "name": app.title,
      "operatingSystem": "Android",
      "applicationCategory": `${app.category}Application`,
      "fileSize": app.size,
      "softwareVersion": formattedVersion,
      "author": {
        "@type": "Organization",
        "name": app.developer && app.developer !== 'GoAPK' ? app.developer : 'Android Developer'
      },
      "publisher": {
        "@type": "Organization",
        "name": "GoAPK",
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/logo.png`
        }
      },
      "downloadUrl": app.versions?.[0]?.downloadUrl 
        ? `${window.location.origin}${app.versions[0].downloadUrl}`
        : canonicalUrl,
      "description": app.description,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    };
    scriptEl.textContent = JSON.stringify(schemaData);

    return () => {
      document.title = previousTitle;
      if (metaDesc && previousDesc !== null) {
        metaDesc.setAttribute('content', previousDesc);
      }
      if (scriptEl) {
        scriptEl.remove();
      }
    };
  }, [app, pageTitleTemplate, pageMetaDescriptionTemplate, formattedVersion]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    onAddReview(app.id, {
      userName: reviewName,
      userAvatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80`,
      rating: reviewRating,
      comment: reviewComment
    });

    setReviewName('');
    setReviewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('App link copied to clipboard!');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
      
      {/* Top Back & Breadcrumb Navigation Bar */}
      <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-700/20 text-xs">
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border font-bold transition-all cursor-pointer active:scale-95 shrink-0 ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
          }`}
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Back</span>
        </button>

        {/* Breadcrumb Path - Scrollable & Compact on Mobile */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none pl-2">
          <span className="hover:underline cursor-pointer shrink-0" onClick={onBack}>Home</span>
          <span className="text-slate-600">/</span>
          <span className="font-medium text-emerald-500 shrink-0">{app.category}</span>
          <span className="text-slate-600">/</span>
          <span className={`font-semibold truncate max-w-[120px] sm:max-w-[200px] ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {app.title}
          </span>
        </div>
      </div>

      {/* Main App Page Card */}
      <div className={`rounded-2xl sm:rounded-3xl border shadow-xl p-4 sm:p-8 space-y-6 sm:space-y-8 transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        
        {/* Category Badge & Utility Bar */}
        <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-700/20">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {app.category}
            </span>
            <span className={`text-[11px] sm:text-xs font-mono font-medium px-2 py-0.5 rounded border ${
              darkMode ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {formattedVersion}
            </span>
            {app.isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verified Safe</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Google Drive</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={copyShareLink}
              title="Share App"
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Hero Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-slate-700/20">
          <div className="flex items-start gap-3.5 sm:gap-6 w-full sm:w-auto">
            {!imgError ? (
              <img
                src={app.icon}
                alt={app.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg border border-slate-700/30 shrink-0 bg-slate-100 dark:bg-slate-800"
              />
            ) : (
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold flex items-center justify-center text-2xl sm:text-3xl shadow-lg shrink-0">
                {app.title.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-snug break-words">
                {app.title}
              </h1>
              <p className={`text-xs sm:text-sm font-medium mt-0.5 sm:mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Developed by <span className="text-emerald-500 font-semibold">{app.developer}</span>
              </p>
              
              {/* Clean Mobile-Optimized Badge Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 text-xs flex-wrap">
                <div className="flex items-center gap-1 font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 text-[11px] sm:text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{app.rating}</span>
                </div>
                <div className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[11px] sm:text-xs">
                  {app.downloadsCount}
                </div>
                <div className={`font-medium px-2 py-0.5 rounded-md border text-[11px] sm:text-xs ${
                  darkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {app.minAndroid}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons - Full-Width Touch Button on Mobile */}
          <div className="flex flex-col items-center justify-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <button
              onClick={() => onStartDownload(app, app.versions[0])}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>Download APK ({app.size})</span>
            </button>

            {/* Hidden on mobile because scanning QR on the same device screen is impossible */}
            <button
              onClick={() => onOpenQrCode(app)}
              className={`hidden sm:flex w-full px-4 py-2 text-xs font-semibold rounded-xl border transition-colors items-center justify-center gap-2 cursor-pointer ${
                darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              <span>Scan QR for Desktop/Tablet</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Scrollable & Touch Friendly */}
        <div className="flex items-center gap-1.5 border-b border-slate-700/20 pb-2 overflow-x-auto scrollbar-none -mx-1 px-1">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'about'
                ? 'bg-emerald-500 text-white shadow-md'
                : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            About &amp; Screenshots
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-emerald-500 text-white shadow-md'
                : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safety Scan ({app.safetyChecks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('versions')}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'versions'
                ? 'bg-emerald-500 text-white shadow-md'
                : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Versions ({app.versions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-emerald-500 text-white shadow-md'
                : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Reviews ({app.reviews.length})</span>
          </button>
        </div>

        {/* TAB 1: ABOUT & SCREENSHOTS */}
        {activeTab === 'about' && (
          <div className="space-y-8">
            
            {/* Screenshots Gallery with Reliable Fallbacks */}
            {app.screenshots.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400">
                  App Preview & Screenshots
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                  {app.screenshots.map((img, idx) => {
                    const isFailed = failedScreenshots[img];
                    const displaySrc = isFailed
                      ? 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80'
                      : img;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage(displaySrc)}
                        className="relative group flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-700/30 shadow-md bg-slate-800/40 w-36 sm:w-44 h-52 sm:h-64 flex flex-col items-center justify-center"
                      >
                        <img
                          src={displaySrc}
                          alt={`${app.title} screenshot ${idx + 1}`}
                          onError={() => handleScreenshotError(img)}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* What's New */}
            {app.versions[0]?.changelog && (
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-bold text-sm text-emerald-500">
                  <Sparkles className="w-4 h-4" />
                  <span>What's New in Version {app.versions[0].versionName}</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside leading-relaxed">
                  {app.versions[0].changelog.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description & Overview */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Overview & Description
              </h3>
              <p className={`text-sm leading-relaxed whitespace-pre-line ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {app.longDescription || app.description}
              </p>
            </div>

            {/* Key Features Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Features of {app.title}
              </h3>
              <ul className={`text-sm leading-relaxed space-y-2.5 p-5 rounded-2xl border ${
                darkMode ? 'bg-slate-800/40 border-slate-700/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <div>
                    <strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Secure High-Speed Access:</strong> Download files safely via our integrated Google Drive CDNs.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <div>
                    <strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Optimized File Bundle:</strong> Lightweight APK package optimized for compatibility with Android platforms.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <div>
                    <strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Original & Verified:</strong> Signature verified safe from tampering, injections, or malicious modifications.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <div>
                    <strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Fluid Experience:</strong> Seamless performance tailored specifically for category requirements ({app.category}).
                  </div>
                </li>
              </ul>
            </div>

            {/* Installation Guide Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Step-by-Step Installation Guide
              </h3>
              <div className={`text-sm leading-relaxed p-5 rounded-2xl border space-y-3.5 ${
                darkMode ? 'bg-slate-800/40 border-slate-700/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <p className="text-xs text-slate-400">Follow these standard instructions to run {app.title} APK on your Android device:</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <h4 className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Download Package</h4>
                      <p className="text-xs text-slate-400">Click the download button above to retrieve the secure installer package.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <h4 className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Enable Unknown Sources</h4>
                      <p className="text-xs text-slate-400">Go to Settings &gt; Security and toggle "Allow installation from Unknown Sources" or authorize browser permissions if prompted.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <h4 className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Run Installer</h4>
                      <p className="text-xs text-slate-400">Open your File Manager, head to the Downloads folder, click on the <code className="text-emerald-500 font-mono">.apk</code> file, and confirm setup by tapping Install.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Frequently Asked Questions (FAQ)
              </h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className={`font-bold text-xs mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Q1: Is {app.title} APK safe to download from GoAPK?
                  </h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Yes. All files are checked against multiple antivirus scanners and matched with secure signatures before publishing.
                  </p>
                </div>
                <div className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className={`font-bold text-xs mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Q2: How do I update {app.title} to a newer version?
                  </h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Simply visit this page again to download the latest release bundle. Installing the updated file will overwrite the existing version without deleting app data.
                  </p>
                </div>
                <div className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className={`font-bold text-xs mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Q3: Does GoAPK host modified or clean versions?
                  </h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    We prioritize serving clean, original packages direct from developer sources, backed by cryptographically matching signatures.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Specifications Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400">
                APK Technical Specifications
              </h3>
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div><span className="text-slate-400 font-medium">Package Name:</span> <span className="font-mono text-emerald-500">{app.packageName}</span></div>
                <div><span className="text-slate-400 font-medium">File Size:</span> <span className="font-semibold">{app.size}</span></div>
                <div><span className="text-slate-400 font-medium">Min Android:</span> <span className="font-semibold">{app.minAndroid}</span></div>
                <div><span className="text-slate-400 font-medium">Architecture:</span> <span className="font-semibold">{app.architecture || 'arm64-v8a'}</span></div>
                <div><span className="text-slate-400 font-medium">Last Updated:</span> <span className="font-semibold">{app.updatedDate}</span></div>
                <div><span className="text-slate-400 font-medium">SHA-256 Hash:</span> <span className="font-mono text-[10px] break-all text-slate-400">{app.versions[0]?.sha256}</span></div>
              </div>
            </div>

            {/* Older Versions Archive Section for SEO indexability */}
            {app.versions.length > 1 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Download Older Versions of {app.title}
                </h3>
                <p className="text-xs text-slate-400">
                  If the latest release is not compatible with your device, you can roll back and download older, verified APK version files here:
                </p>
                <div className={`p-4 rounded-2xl border divide-y ${
                  darkMode 
                    ? 'bg-slate-800/40 border-slate-700/60 divide-slate-700/40' 
                    : 'bg-slate-50 border-slate-200 divide-slate-200'
                }`}>
                  {app.versions.map((ver, idx) => (
                    <div key={idx} className={`py-3 flex items-center justify-between gap-4 ${idx === 0 ? 'pt-0' : ''} ${idx === app.versions.length - 1 ? 'pb-0' : ''}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>v{ver.versionName}</span>
                          {ver.isLatest && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                              LATEST
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Released {ver.releaseDate} • {ver.fileSize}
                        </p>
                      </div>
                      <button
                        onClick={() => onStartDownload(app, ver)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: SAFETY & INTEGRITY */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 flex-shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm">Security & Integrity Guarantee</h4>
                <p className={`mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  This APK has undergone automated static signature verification and multi-engine antivirus malware scanning prior to catalog publishing.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {app.safetyChecks.map((check, index) => (
                <div key={index} className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className={`font-bold text-sm ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{check.label}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{check.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: OLDER VERSIONS */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Need an older release compatible with legacy devices? Select any version below to download:
            </p>
            <div className="divide-y divide-slate-700/20">
              {app.versions.map((ver, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>v{ver.versionName}</span>
                      {ver.isLatest && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                          LATEST RELEASE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Released {ver.releaseDate} • {ver.fileSize} • {ver.minAndroid}
                    </p>
                  </div>
                  <button
                    onClick={() => onStartDownload(app, ver)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS & RATING FORM */}
        {activeTab === 'reviews' && (
          <div className="space-y-8">
            
            {/* Existing Reviews List */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                User Feedback ({app.reviews.length})
              </h3>

              {app.reviews.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No reviews submitted yet. Be the first to rate this APK!</p>
              ) : (
                <div className="space-y-3">
                  {app.reviews.map((rev) => (
                    <div key={rev.id} className={`p-4 rounded-2xl border ${
                      darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img src={rev.userAvatar} alt={rev.userName} className="w-7 h-7 rounded-full object-cover" />
                          <span className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{rev.userName}</span>
                          {rev.verifiedDownload && (
                            <span className="text-[10px] text-emerald-500 font-medium">Verified Download</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-600'}`} 
                          />
                        ))}
                      </div>

                      <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Review Form */}
            <form onSubmit={handleReviewSubmit} className={`p-5 rounded-2xl border space-y-4 ${
              darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <h4 className={`font-bold text-sm flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                Write a Review for {app.title}
              </h4>

              {reviewSubmitted && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500 text-xs font-semibold">
                  Thank you! Your review has been added to the catalog.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="e.g. AndroidUser42"
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Rating</label>
                  <div className="flex items-center gap-1 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`w-5 h-5 cursor-pointer transition-colors ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Your Experience / Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How does this APK perform on your phone?"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                Submit Review
              </button>
            </form>

          </div>
        )}

        {/* Similar Apps Section */}
        {similarApps.length > 0 && (
          <div className="pt-6 border-t border-slate-700/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Similar Apps in {app.category}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Explore related applications you might also enjoy</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {similarApps.map((similarApp) => (
                <div
                  key={similarApp.id}
                  onClick={() => {
                    if (onSelectApp) {
                      onSelectApp(similarApp);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between gap-3 ${
                    darkMode
                      ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 hover:border-emerald-500/40'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={similarApp.icon}
                      alt={similarApp.title}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700/30 flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs truncate group-hover:text-emerald-500 transition-colors">
                        {similarApp.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {similarApp.developer}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] mt-1 text-slate-400">
                        <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {similarApp.rating}
                        </span>
                        <span>•</span>
                        <span>{similarApp.size}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectApp) {
                        onSelectApp(similarApp);
                      }
                    }}
                    title="View Details & Download"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-slate-950 border border-emerald-500/20 font-bold text-xs transition-all flex-shrink-0 cursor-pointer"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Image Preview Zoom Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={selectedImage} alt="Preview Zoom" className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

    </div>
  );
};
