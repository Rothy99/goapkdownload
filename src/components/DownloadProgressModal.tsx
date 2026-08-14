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

const openCenteredAdPopup = () => {
  const w = 850;
  const h = 650;
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

  const systemZoom = width / window.screen.width;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;
  
  try {
    const adWin = window.open(
      'https://www.effectivecpmnetwork.com/xn8iypyef6?key=7bea000676617fb01d7559651705c9f7',
      'SponsorAd',
      `scrollbars=yes,width=${w / systemZoom},height=${h / systemZoom},top=${top},left=${left}`
    );
    return adWin;
  } catch (e) {
    console.error("Popup blocked:", e);
    return null;
  }
};

export const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  app,
  version,
  onClose,
  darkMode,
  onOpenInstallGuide
}) => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(10);

  if (!app) return null;

  const targetVer = version || app.versions[0];

  useEffect(() => {
    setProgress(0);
    setIsCompleted(false);
    setSecondsRemaining(10);

    // Open the centered ad popup window
    const adWindow = openCenteredAdPopup();

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          
          // Close the ad popup window automatically
          try {
            if (adWindow && !adWindow.closed) {
              adWindow.close();
            }
          } catch (err) {
            console.error("Error closing ad popup:", err);
          }

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

          setIsCompleted(true);
          setProgress(100);
          return 0;
        }

        const nextSec = prev - 1;
        setProgress(Math.round(((10 - nextSec) / 10) * 100));
        return nextSec;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      try {
        if (adWindow && !adWindow.closed) {
          adWindow.close();
        }
      } catch (err) {}
    };
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
            <span>SECURE DOWNLOADING MODULE</span>
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
              {isCompleted ? 'Sponsor Ad closed successfully!' : `Sponsor Ad closing in ${secondsRemaining}s...`}
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
            <span>Countdown: <strong className="text-slate-200 font-mono">{secondsRemaining}s</strong></span>
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
