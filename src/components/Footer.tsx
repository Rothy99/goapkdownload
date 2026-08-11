import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  darkMode: boolean;
  onOpenInstallGuide: () => void;
  onOpenSubmit: () => void;
  onOpenRequest: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  darkMode,
  onOpenInstallGuide,
  onOpenSubmit,
  onOpenRequest
}) => {
  return (
    <footer className={`border-t mt-16 transition-colors duration-200 ${
      darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-400'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1 */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <Logo size={32} className="w-8 h-8" />
              <span className="font-extrabold text-xl tracking-tight text-white">GoAPKDownload</span>
            </div>
            <p className="text-xs leading-relaxed">
              Safe, verified, and ultra-fast direct APK downloads for Android applications and games. No registration required.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% VirusTotal & Play Protect Clean</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Store Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={onOpenRequest} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Request an APK
                </button>
              </li>
              <li>
                <button onClick={onOpenInstallGuide} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Android Installation Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Security & Integrity</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>SHA-256 Signature Verification</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Original Package Hashes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>DMCA Safe Harbor Compliant</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Legal Disclaimer</h4>
            <p className="text-[11px] leading-relaxed text-slate-400">
              GoAPKDownload is not affiliated with Google, Android, or Google Play. All trademarks, app names, logos, and screenshots are property of their respective developers.
            </p>
          </div>

        </div>

        <div className="mt-12 pt-6 pb-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} GoAPKDownload Platform. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Designed for Android Enthusiasts</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
