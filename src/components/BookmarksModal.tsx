import React from 'react';
import { X, Bookmark, Download, Trash2, Smartphone } from 'lucide-react';
import { AppItem } from '../types';

interface BookmarksModalProps {
  bookmarkedApps: AppItem[];
  onClose: () => void;
  darkMode: boolean;
  onSelectApp: (app: AppItem) => void;
  onRemoveBookmark: (appId: string) => void;
  onStartDownload: (app: AppItem) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  bookmarkedApps,
  onClose,
  darkMode,
  onSelectApp,
  onRemoveBookmark,
  onStartDownload
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      
      <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl border p-6 sm:p-8 space-y-6 my-8 ${
        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        <div className="flex items-center justify-between border-b pb-4 border-slate-700/30">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="font-extrabold text-lg">Saved APK Library ({bookmarkedApps.length})</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border cursor-pointer ${
              darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {bookmarkedApps.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No saved apps in your library yet.</p>
            <p className="text-xs text-slate-500">Click the bookmark icon on any app card to save it for quick access.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 divide-y divide-slate-700/30">
            {bookmarkedApps.map((app) => (
              <div key={app.id} className="pt-3 flex items-center justify-between gap-4">
                <div 
                  onClick={() => {
                    onSelectApp(app);
                    onClose();
                  }}
                  className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                >
                  <img src={app.icon} alt={app.title} className="w-12 h-12 rounded-xl object-cover shadow-sm flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate">{app.title}</h4>
                    <p className="text-xs text-slate-400">{app.developer} • {app.size}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onStartDownload(app)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>APK</span>
                  </button>

                  <button
                    onClick={() => onRemoveBookmark(app.id)}
                    className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
