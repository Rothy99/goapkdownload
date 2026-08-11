import React, { useState } from 'react';
import { X, MessageSquarePlus, ThumbsUp, Plus, CheckCircle2 } from 'lucide-react';
import { AppRequest, AppCategory } from '../types';

interface RequestAppModalProps {
  requests: AppRequest[];
  onClose: () => void;
  darkMode: boolean;
  onRequestSubmit: (req: Omit<AppRequest, 'id' | 'votes' | 'date' | 'status'>) => void;
  onUpvoteRequest: (id: string) => void;
}

const CATEGORIES: AppCategory[] = [
  'Games', 'Tools', 'Media & Video', 'Productivity', 'Photography', 'Utilities', 'Social', 'Finance', 'Health & Fitness'
];

export const RequestAppModal: React.FC<RequestAppModalProps> = ({
  requests,
  onClose,
  darkMode,
  onRequestSubmit,
  onUpvoteRequest
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [title, setTitle] = useState('');
  const [developer, setDeveloper] = useState('');
  const [category, setCategory] = useState<AppCategory>('Games');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onRequestSubmit({
      title,
      developer: developer || 'Unknown Developer',
      category,
      note,
      requestedBy: 'You'
    });

    setTitle('');
    setDeveloper('');
    setNote('');
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActiveTab('list');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      
      <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl border p-6 sm:p-8 space-y-6 my-8 ${
        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        <div className="flex items-center justify-between border-b pb-4 border-slate-700/30">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-teal-400" />
            <h2 className="font-extrabold text-lg">APK Request Hub</h2>
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

        {/* Tab Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Requested APKs ({requests.length})
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'new'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request New APK</span>
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {requests.map((req) => (
              <div key={req.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm truncate">{req.title}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {req.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">By {req.developer} • Requested by {req.requestedBy}</p>
                  {req.note && <p className="text-xs text-slate-300 italic mt-1.5">"{req.note}"</p>}
                </div>

                <button
                  onClick={() => onUpvoteRequest(req.id)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{req.votes}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitted && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your request has been posted to the request board!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">App / Game Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. GTA San Andreas APK"
                className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Developer Name</label>
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder="e.g. Rockstar Games"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Additional Notes / Version Details</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Specify target version or minimum Android compatibility requirements..."
                className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg transition-colors cursor-pointer"
            >
              Post Request
            </button>
          </form>
        )}

      </div>

    </div>
  );
};
