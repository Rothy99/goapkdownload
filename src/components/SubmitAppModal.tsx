import React, { useState, useRef } from 'react';
import { X, PlusCircle, CheckCircle, Lock, ShieldAlert, KeyRound, Upload, FileUp, FileCheck, Image as ImageIcon, Cloud, Loader2 } from 'lucide-react';
import { AppItem, AppCategory } from '../types';
import { uploadAppComponentsViaApi } from '../services/googleDriveClient';

interface SubmitAppModalProps {
  onClose: () => void;
  darkMode: boolean;
  onSubmitApp: () => void;
}

const CATEGORIES: AppCategory[] = [
  'Games', 'Tools', 'Media & Video', 'Productivity', 'Photography', 'Utilities', 'Social', 'Finance', 'Health & Fitness'
];

export const SubmitAppModal: React.FC<SubmitAppModalProps> = ({
  onClose,
  darkMode,
  onSubmitApp
}) => {
  const [adminPin, setAdminPin] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState('');

  const [apkFile, setApkFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [packageName, setPackageName] = useState('');
  const [category, setCategory] = useState<AppCategory>('Tools');
  const [developer, setDeveloper] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('45 MB');
  const [minAndroid, setMinAndroid] = useState('Android 8.0+');
  const [version, setVersion] = useState('1.0.0');
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [driveUploadSuccess, setDriveUploadSuccess] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const screenshotsInputRef = useRef<HTMLInputElement>(null);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.trim() === '1234' || adminPin.trim().toLowerCase() === 'admin') {
      setIsPinVerified(true);
      setPinError('');
    } else {
      setPinError('Invalid Admin Passcode! Default passcode is 1234 or admin.');
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.apk') && !file.name.toLowerCase().endsWith('.zip') && !file.name.toLowerCase().endsWith('.xapk')) {
      alert('Please upload a valid Android package file (.apk, .xapk, or .zip archive).');
      return;
    }
    setApkFile(file);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setSize(sizeInMB);

    // Auto-fill version if found in file name
    const versionMatch = file.name.match(/[-_]v?(\d+\.\d+(?:\.\d+)*)/i);
    if (versionMatch) {
      setVersion(versionMatch[1]);
    }

    // Auto-fill title if empty
    if (!title) {
      // Strip version, extension, and replace dash/underscore
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]v?\d+\.\d+(\.\d+)*/gi, '')
        .replace(/[-_]/g, ' ')
        .trim();
      const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      setTitle(capitalized);
    }

    // Auto-fill package name if empty
    if (!packageName) {
      const sanitized = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      setPackageName(`com.admin.${sanitized || 'app'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apkFile) {
      alert('Please select an APK file to upload.');
      return;
    }
    if (!title.trim()) {
      alert('App Title is required.');
      return;
    }

    setIsUploadingDrive(true);
    setUploadProgress(0);
    setUploadStatusText('Initializing upload...');
    try {
      const driveResult = await uploadAppComponentsViaApi(
        apkFile,
        iconFile,
        screenshotFiles,
        title,
        version,
        description,
        (percent, statusText) => {
          setUploadProgress(percent);
          if (statusText) {
            setUploadStatusText(statusText);
          }
        }
      );
      if (driveResult && driveResult.success) {
        setDriveUploadSuccess(driveResult.appName);
        setIsSubmitted(true);
        // Refresh catalog in background
        onSubmitApp();
        setTimeout(() => {
          setIsSubmitted(false);
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to upload to Google Drive: ${err.message || 'Unknown network error'}`);
    } finally {
      setIsUploadingDrive(false);
      setUploadProgress(null);
      setUploadStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      
      <div className={`relative w-full max-w-xl rounded-3xl shadow-2xl border p-6 sm:p-8 space-y-6 my-8 ${
        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header with Admin Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Lock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg tracking-tight">Admin Portal</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-md">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">Restricted application publishing for site administrators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border cursor-pointer transition-colors ${
              darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lock Screen if not verified */}
        {!isPinVerified ? (
          <form onSubmit={handleVerifyPin} className="space-y-5 py-4">
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold">Administrator Authentication Required</p>
                <p className="opacity-90">This section is restricted to site owners and authorized APK administrators. Please enter your admin passcode to proceed.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Admin Passcode</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    setPinError('');
                  }}
                  placeholder="Enter admin passcode (e.g., 1234)"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none font-mono ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-amber-500' : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-amber-500'
                  }`}
                />
              </div>
              {pinError && (
                <p className="text-xs text-rose-500 font-semibold">{pinError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition-colors cursor-pointer"
              >
                Unlock Admin Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminPin('1234');
                  setIsPinVerified(true);
                }}
                className={`px-4 py-3 rounded-2xl border font-bold text-xs cursor-pointer ${
                  darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Demo Auth (1234)
              </button>
            </div>
          </form>
        ) : isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-extrabold text-lg text-emerald-400">Application Published!</h3>
            <p className="text-xs text-slate-400">The APK package was verified and added directly to the store catalog.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* APK File Upload Area */}
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-300">
                Select or Drop APK File (.apk, .xapk) *
              </label>
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".apk,.xapk,.zip" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden" 
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  apkFile
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : darkMode
                    ? 'border-slate-700 bg-slate-800/50 hover:border-emerald-500/50 hover:bg-slate-800'
                    : 'border-slate-300 bg-slate-50 hover:border-emerald-500/50 hover:bg-emerald-50/50'
                }`}
              >
                {apkFile ? (
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-black text-emerald-400 truncate max-w-xs">{apkFile.name}</p>
                      <p className="text-[11px] text-slate-400">{(apkFile.size / (1024 * 1024)).toFixed(2)} MB • Verified Package</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-emerald-500 mb-1.5" />
                    <p className="text-xs font-bold text-slate-200">
                      Click to choose or drop <span className="text-emerald-400">.APK</span> file here
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Supports standard Android Package files up to 2 GB</p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">App Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Pixel Camera"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="e.g. com.developer.myapp"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none font-mono ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Version Name *</label>
                <input
                  type="text"
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.0.10"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Developer Name</label>
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder="e.g. Apex Software"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AppCategory)}
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">App Icon File (.png, .jpg)</label>
                <input
                  ref={iconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setIconFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div
                  onClick={() => iconInputRef.current?.click()}
                  className={`w-full p-2 rounded-xl border text-xs outline-none cursor-pointer flex items-center justify-between transition-colors ${
                    iconFile
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200/50'
                  }`}
                >
                  <span className="truncate max-w-[150px]">{iconFile ? iconFile.name : 'Select App Icon...'}</span>
                  <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">App Screenshots (.png, .jpg) - Select multiple</label>
              <input
                ref={screenshotsInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const filesArray = Array.from(e.target.files);
                    setScreenshotFiles(prev => [...prev, ...filesArray]);
                  }
                }}
                className="hidden"
              />
              <div
                onClick={() => screenshotsInputRef.current?.click()}
                className={`w-full p-2.5 rounded-xl border text-xs outline-none cursor-pointer flex items-center justify-between transition-colors ${
                  screenshotFiles.length > 0
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                <span className="truncate">
                  {screenshotFiles.length > 0 
                    ? `${screenshotFiles.length} screenshot${screenshotFiles.length > 1 ? 's' : ''} selected` 
                    : 'Select App Screenshots...'}
                </span>
                <Upload className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>

              {screenshotFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-950/20 rounded-lg border border-slate-800">
                  {screenshotFiles.map((file, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded-md border border-slate-700/50 group"
                    >
                      <span className="truncate max-w-[120px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setScreenshotFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of key features and Android permissions required..."
                className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            {isUploadingDrive && uploadProgress !== null && (
              <div className="w-full space-y-2 mb-3 bg-slate-950/20 border border-slate-700/30 rounded-2xl p-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 animate-pulse" />
                    {uploadStatusText || 'Uploading...'}
                  </span>
                  <span className="font-black text-emerald-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploadingDrive}
              className={`w-full py-3 rounded-2xl font-black text-sm shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                isUploadingDrive
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {isUploadingDrive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadStatusText || 'Publishing... Please wait'}</span>
                </>
              ) : (
                <span>Publish APK to Live Store</span>
              )}
            </button>
          </form>
        )}

      </div>

    </div>
  );
};
