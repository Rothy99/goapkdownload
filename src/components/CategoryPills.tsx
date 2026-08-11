import React from 'react';
import { 
  AppCategory 
} from '../types';
import { 
  Gamepad2, 
  Wrench, 
  Users, 
  Briefcase, 
  Camera, 
  Video, 
  Layers, 
  DollarSign, 
  HeartPulse, 
  Grid
} from 'lucide-react';

interface CategoryPillsProps {
  selectedCategory: AppCategory;
  onSelectCategory: (cat: AppCategory) => void;
  activeFilter?: string; // 'all' | 'verified' | 'editors' | 'trending'
  setActiveFilter?: (filter: string) => void;
  darkMode: boolean;
}

const CATEGORIES: { label: AppCategory; icon: React.ReactNode }[] = [
  { label: 'All', icon: <Grid className="w-3.5 h-3.5" /> },
  { label: 'Games', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  { label: 'Tools', icon: <Wrench className="w-3.5 h-3.5" /> },
  { label: 'Media & Video', icon: <Video className="w-3.5 h-3.5" /> },
  { label: 'Productivity', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { label: 'Photography', icon: <Camera className="w-3.5 h-3.5" /> },
  { label: 'Utilities', icon: <Layers className="w-3.5 h-3.5" /> },
  { label: 'Social', icon: <Users className="w-3.5 h-3.5" /> },
  { label: 'Finance', icon: <DollarSign className="w-3.5 h-3.5" /> },
  { label: 'Health & Fitness', icon: <HeartPulse className="w-3.5 h-3.5" /> }
];

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedCategory,
  onSelectCategory,
  darkMode
}) => {
  return (
    <div id="category-pills-section" className="mb-3.5">
      {/* Category Horizontal Track Container with Subtle Swipe Indicator */}
      <div className="relative group">
        {/* Horizontal Track */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-700/20 pr-12">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => onSelectCategory(cat.label)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? darkMode 
                      ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-emerald-600 border-emerald-700 text-white shadow-md'
                    : darkMode
                      ? 'border-slate-800 bg-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Subtle Right-side Gradient Mask indicating horizontal scroll/swipe */}
        <div className={`pointer-events-none absolute right-0 top-0 bottom-3 w-12 bg-gradient-to-l transition-colors z-10 ${
          darkMode ? 'from-slate-950 to-transparent' : 'from-slate-50 to-transparent'
        }`} />
      </div>
    </div>
  );
};

