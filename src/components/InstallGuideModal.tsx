import React from 'react';
import { X, Smartphone, CheckCircle2, ShieldAlert, FolderOpen, ArrowRight, Settings } from 'lucide-react';

interface InstallGuideModalProps {
  onClose: () => void;
  darkMode: boolean;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  onClose,
  darkMode
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      
      <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl border p-6 sm:p-8 space-y-6 my-8 ${
        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        <div className="flex items-center justify-between border-b pb-4 border-slate-700/30">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h2 className="font-extrabold text-lg">How to Install APK Files on Android</h2>
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

        <div className="space-y-4">
          
          {/* Step 1 */}
          <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>Download the APK File</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Click the "Download APK" button on any app page. Your browser will save the file (e.g. <code className="text-emerald-400 font-mono">Spotify_v8.9.apk</code>) to your phone's Downloads directory.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Enable "Install Unknown Apps"</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                If prompted by Android during opening: Go to <strong>Settings → Security & Privacy → Install Unknown Apps</strong>, select your Browser or File Manager (e.g. Chrome, My Files), and switch on <strong>"Allow from this source"</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-teal-400" />
                <span>Open File & Tap Install</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Tap on the downloaded file in your browser's download manager or File Explorer. Confirm the installation pop-up by tapping <strong>Install</strong>.
              </p>
            </div>
          </div>

          {/* Play Protect Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-amber-200">Google Play Protect Prompt Notice:</strong>
              <span>
                If Google Play Protect displays a message ("Blocked by Play Protect"), tap <strong>"More details"</strong> and then <strong>"Install anyway"</strong>. All APK packages published on our store are scanned 0/68 safe on VirusTotal.
              </span>
            </div>
          </div>

        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-sm hover:bg-emerald-400 transition-colors cursor-pointer"
        >
          Got It, Thanks!
        </button>

      </div>

    </div>
  );
};
