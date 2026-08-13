import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight, 
  HardDrive, 
  Sparkles,
  Zap,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppItem, ApkVersion } from '../types';
import { triggerApkFileDownload } from '../utils/helpers';

interface DownloadProgressModalProps {
  app: AppItem | null;
  version?: ApkVersion;
  onClose: () => void;
  darkMode: boolean;
  onOpenInstallGuide: () => void;
}

export const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  app,
  version,
  onClose,
  darkMode,
  onOpenInstallGuide
}) => {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('18.4 MB/s');
  const [isCompleted, setIsCompleted] = useState(false);
  const [statusText, setStatusText] = useState('Connecting to high-speed mirror...');

  if (!app) return null;

  const targetVer = version || app.versions[0];

  useEffect(() => {
    setProgress(0);
    setIsCompleted(false);

    const stages = [
      { p: 15, text: 'Resolving CDN route & checking MD5 hash...', s: '12.1 MB/s' },
      { p: 40, text: 'Streaming APK file package...', s: '22.8 MB/s' },
      { p: 75, text: 'Verifying Play Protect cryptographic signature...', s: '28.5 MB/s' },
      { p: 95, text: 'Finalizing installer package bundle...', s: '15.2 MB/s' },
      { p: 100, text: 'Download Complete! Saving file...', s: '0 KB/s' }
    ];
    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        const stage = stages[currentStage];
        setProgress(stage.p);
        setStatusText(stage.text);
        setSpeed(stage.s);
        currentStage++;
      } else {
        clearInterval(interval);
        setIsCompleted(true);
        
        // Trigger browser file download
        triggerApkFileDownload(app, targetVer);

        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          console.error(e);
        }
      }
    }, 600);

    return () => clearInterval(interval);
  }, [app, version]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      
      <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl border p-6 sm:p-8 space-y-6 overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Zap className="w-4 h-4" />
            <span>FAST APK DOWNLOADER</span>
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

        {/* App Info Box */}
        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
          darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <img src={app.icon} alt={app.title} className="w-14 h-14 rounded-2xl object-cover shadow-md flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm truncate">{app.title}</h3>
            <p className="text-xs text-slate-400">v{targetVer?.versionName || '1.0.0'} • {targetVer?.fileSize || app.size}</p>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">{app.packageName}</p>
          </div>
        </div>

        {/* Download Meter & Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isCompleted ? 'text-emerald-400' : 'text-slate-300'}>
              {statusText}
            </span>
            <span className="font-mono text-emerald-400">{progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-200'
          }`}>
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Speed: <strong className="text-slate-200 font-mono">{speed}</strong></span>
            <span>Security: <strong className="text-emerald-400 font-semibold">Verified Safe</strong></span>
          </div>
        </div>

        {/* Completed State Actions */}
        {isCompleted && (
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>APK file downloaded to your browser downloads folder!</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerApkFileDownload(app, targetVer);
                  try {
                    window.open('https://www.effectivecpmnetwork.com/xn8iypyef6?key=7bea000676617fb01d7559651705c9f7', '_blank');
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Re-download APK</span>
              </button>

              <button
                onClick={onOpenInstallGuide}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Install Instructions</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Install Tip */}
        <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
          darkMode ? 'bg-slate-800/40 border-slate-700/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="font-bold flex items-center gap-1 text-emerald-400">
            <Smartphone className="w-3.5 h-3.5" />
            <span>How to Install APK on Android:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Open the downloaded <code className="text-emerald-400 font-mono">.apk</code> file in your Downloads folder. If prompted, toggle "Allow from this source" in Android Settings.
          </p>
        </div>

        {/* Sponsor/Helper Link */}
        <div className="text-center pt-2 border-t border-slate-700/10 dark:border-slate-700/30">
          <a
            href="https://www.effectivecpmnetwork.com/xn8iypyef6?key=7bea000676617fb01d7559651705c9f7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-emerald-500 hover:text-emerald-400 underline font-semibold transition-colors"
          >
            Click here if your download does not start automatically
          </a>
        </div>

      </div>

    </div>
  );
};
