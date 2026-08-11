import React, { useState } from 'react';
import { 
  Download, 
  Star, 
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { AppItem } from '../types';

interface AppCardProps {
  app: AppItem;
  darkMode: boolean;
  isBookmarked?: boolean;
  onSelectApp: (app: AppItem) => void;
  onQuickDownload: (app: AppItem) => void;
  onToggleBookmark?: (appId: string) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  darkMode,
  onSelectApp,
  onQuickDownload
}) => {
  const [imgError, setImgError] = useState(false);
  const latestVersion = app.versions?.find(v => v.isLatest)?.versionName || app.versions?.[0]?.versionName;
  const formattedVersion = latestVersion 
    ? (latestVersion.toLowerCase().startsWith('v') ? latestVersion : `v${latestVersion}`)
    : null;

  return (
    <div 
      onClick={() => onSelectApp(app)}
      className={`group relative rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full cursor-pointer select-none ${
        darkMode
          ? 'bg-slate-800/80 border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800 hover:shadow-xl hover:shadow-emerald-500/5'
          : 'bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header: Fixed Aspect Square App Icon + Info */}
        <div className="flex items-start gap-3.5">
          {/* Icon with fixed aspect ratio container */}
          <div className="relative w-14 h-14 shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-700/20 shadow-xs">
            {!imgError ? (
              <img
                src={app.icon}
                alt={app.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold flex items-center justify-center text-lg">
                {app.title.charAt(0)}
              </div>
            )}
            {app.isVerified && (
              <div 
                className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-xs"
                title="Verified Safe APK"
              >
                <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          {/* App Title & Developer & Version (Strict Single-Line Truncation) */}
          <div className="min-w-0 flex-1 flex flex-col justify-center min-h-[56px]">
            <h3 
              className={`font-black text-sm leading-snug truncate block w-full ${
                darkMode ? 'text-slate-100 group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
              } transition-colors`}
              title={app.title}
            >
              {app.title}
            </h3>

            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className={`truncate block max-w-[120px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {app.developer}
              </span>
              {formattedVersion && (
                <span className={`inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border tracking-tight shrink-0 ${
                  darkMode
                    ? 'bg-slate-900 text-emerald-400 border-slate-700/80'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {formattedVersion}
                </span>
              )}
            </div>

            {/* Rating & Downloads */}
            <div className="flex items-center gap-2 mt-1 text-[11px]">
              <div className="flex items-center gap-1 text-amber-400 font-extrabold">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{app.rating}</span>
              </div>
              <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>•</span>
              <span className={`font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {app.downloadsCount}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Info & Action Anchored to Bottom Flex Baseline */}
      <div className="mt-auto pt-3 border-t border-slate-700/20 flex items-center justify-between gap-2 h-10">
        {/* Exposed Storage Metadata */}
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
          <HardDrive className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="leading-none">{app.size}</span>
        </div>

        {/* Action Button: Download */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickDownload(app);
          }}
          className="h-8 px-3.5 text-xs font-black rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Download</span>
        </button>
      </div>

    </div>
  );
};

export const AppCardSkeleton: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col justify-between h-full animate-pulse select-none ${
        darkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3.5">
          {/* Skeleton Icon */}
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-slate-200 dark:bg-slate-700/80" />

          {/* Skeleton Title & Meta */}
          <div className="min-w-0 flex-1 flex flex-col justify-center min-h-[56px] space-y-2">
            <div className="h-4 w-3/4 rounded-md bg-slate-200 dark:bg-slate-700/80" />
            <div className="h-3 w-1/2 rounded-md bg-slate-200 dark:bg-slate-700/80" />
            <div className="h-3 w-1/3 rounded-md bg-slate-200 dark:bg-slate-700/80" />
          </div>
        </div>
      </div>

      {/* Skeleton Footer */}
      <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700/30 flex items-center justify-between gap-2 h-10">
        <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700/80" />
        <div className="h-8 w-24 rounded-full bg-slate-200 dark:bg-slate-700/80 shrink-0" />
      </div>
    </div>
  );
};

