import React, { useEffect, useRef } from 'react';
import { X, Smartphone, Download, QrCode as QrIcon, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { AppItem } from '../types';

interface QrCodeModalProps {
  app: AppItem | null;
  onClose: () => void;
  darkMode: boolean;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  app,
  onClose,
  darkMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!app) return null;

  const downloadUrl = `${window.location.origin}?app=${app.id}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, downloadUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: darkMode ? '#10b981' : '#0f172a',
          light: darkMode ? '#0f172a' : '#ffffff'
        }
      }, (error) => {
        if (error) console.error('QR generation error:', error);
      });
    }
  }, [app, darkMode, downloadUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      
      <div className={`relative w-full max-w-sm rounded-3xl shadow-2xl border p-6 text-center space-y-6 ${
        darkMode ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-xl border cursor-pointer ${
            darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1 pt-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <QrIcon className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg">Scan to Download on Mobile</h3>
          <p className="text-xs text-slate-400">Point your Android phone camera at the QR code below</p>
        </div>

        {/* QR Canvas */}
        <div className={`p-4 rounded-2xl inline-block border ${
          darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <canvas ref={canvasRef} className="mx-auto rounded-lg" />
        </div>

        {/* App info */}
        <div className="flex items-center justify-center gap-3 text-left">
          <img src={app.icon} alt={app.title} className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h4 className="font-bold text-xs line-clamp-1">{app.title}</h4>
            <p className="text-[10px] text-emerald-400 font-semibold">{app.size} • v{app.versions[0]?.versionName}</p>
          </div>
        </div>

      </div>

    </div>
  );
};
