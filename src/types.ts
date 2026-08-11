export type AppCategory = 
  | 'All'
  | 'Games'
  | 'Tools'
  | 'Social'
  | 'Productivity'
  | 'Photography'
  | 'Media & Video'
  | 'Utilities'
  | 'Personalization'
  | 'Finance'
  | 'Health & Fitness';

export interface ApkVersion {
  versionName: string;
  versionCode: number;
  releaseDate: string;
  fileSize: string;
  minAndroid: string;
  sha256: string;
  changelog: string[];
  downloadUrl: string;
  isLatest?: boolean;
}

export interface AppReview {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1 to 5
  date: string;
  comment: string;
  likes: number;
  dislikes: number;
  verifiedDownload: boolean;
}

export interface SafetyCheck {
  label: string;
  status: 'passed' | 'warning' | 'failed';
  description: string;
}

export interface AppItem {
  id: string;
  title: string;
  packageName: string;
  category: AppCategory;
  rating: number; // e.g. 4.8
  totalReviews: number;
  downloadsCount: string; // e.g. "50M+"
  downloadsNumeric: number;
  icon: string;
  banner?: string;
  developer: string;
  minAndroid: string;
  size: string;
  updatedDate: string;
  isVerified: boolean;
  isFeatured?: boolean;
  isEditorChoice?: boolean;
  isTrending?: boolean;
  tags: string[];
  description: string;
  longDescription: string;
  screenshots: string[];
  versions: ApkVersion[];
  reviews: AppReview[];
  safetyChecks: SafetyCheck[];
  architecture?: string; // e.g. "arm64-v8a, armeabi-v7a"
}

export interface AppSubmission {
  id: string;
  title: string;
  packageName: string;
  category: AppCategory;
  developer: string;
  description: string;
  size: string;
  minAndroid: string;
  iconUrl: string;
  apkFileUrl?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AppRequest {
  id: string;
  title: string;
  developer: string;
  category: AppCategory;
  note: string;
  votes: number;
  requestedBy: string;
  date: string;
  status: 'pending' | 'fulfilled';
}
