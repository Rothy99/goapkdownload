import { AppItem, AppRequest } from '../types';

export const INITIAL_APPS: AppItem[] = [
  {
    id: 'spotify-music',
    title: 'Spotify: Music and Podcasts',
    packageName: 'com.spotify.music',
    category: 'Media & Video',
    rating: 4.7,
    totalReviews: 28450000,
    downloadsCount: '1B+',
    downloadsNumeric: 1000000000,
    icon: 'https://images.unsplash.com/photo-1614680376593-902f749f711c?auto=format&fit=crop&w=256&q=80',
    banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    developer: 'Spotify AB',
    minAndroid: 'Android 7.0+',
    size: '84.2 MB',
    updatedDate: '2026-08-01',
    isVerified: true,
    isFeatured: true,
    isEditorChoice: true,
    isTrending: true,
    architecture: 'arm64-v8a, armeabi-v7a, x86',
    tags: ['Music', 'Streaming', 'Podcasts', 'Audio', 'Playlist'],
    description: 'Play millions of songs, audiobooks, and podcasts for free on your mobile device or tablet.',
    longDescription: `Spotify gives you access to a world of free music, curated playlists, artists, and podcasts you love. Discover new music, podcasts, top songs or listen to your favorite artists, albums.

Key Features:
- Stream over 100 million songs and 5 million podcasts
- Create and share your own customized playlists
- Enjoy personalized recommendations made just for your taste
- Offline listening support with Premium APK capabilities
- Cross-platform synchronization across Android TV, Wear OS, and tablet
- High-fidelity lossless audio support on supported devices`,
    screenshots: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80'
    ],
    safetyChecks: [
      { label: 'Google Play Protect', status: 'passed', description: 'Scanned by Play Protect. No malicious code detected.' },
      { label: 'VirusTotal Clean', status: 'passed', description: '0/68 Security Vendors flagged this package as harmful.' },
      { label: 'Signature Integrity', status: 'passed', description: 'Official developer cryptographic signature matched.' }
    ],
    versions: [
      {
        versionName: '8.9.62.580',
        versionCode: 80962580,
        releaseDate: '2026-08-01',
        fileSize: '84.2 MB',
        minAndroid: 'Android 7.0+',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        changelog: ['New AI Smart DJ improvements', 'Enhanced crossfade transitions', 'Bug fixes and performance optimizations'],
        downloadUrl: '#',
        isLatest: true
      },
      {
        versionName: '8.9.50.410',
        versionCode: 80950410,
        releaseDate: '2026-07-15',
        fileSize: '82.8 MB',
        minAndroid: 'Android 7.0+',
        sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        changelog: ['Improved podcast video player controls', 'Fixed layout glitch on tablet landscape'],
        downloadUrl: '#'
      },
      {
        versionName: '8.9.32.220',
        versionCode: 80932220,
        releaseDate: '2026-06-20',
        fileSize: '81.5 MB',
        minAndroid: 'Android 6.0+',
        sha256: '123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
        changelog: ['Added real-time synchronized lyrics for 10M+ additional tracks'],
        downloadUrl: '#'
      }
    ],
    reviews: [
      {
        id: 'rev-1',
        userName: 'Alex Rivers',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
        rating: 5,
        date: '2026-08-02',
        comment: 'Runs super smooth on Android 14. The APK installed quickly without any signature conflicts.',
        likes: 34,
        dislikes: 1,
        verifiedDownload: true
      },
      {
        id: 'rev-2',
        userName: 'David Chen',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
        rating: 4,
        date: '2026-07-28',
        comment: 'Great update, sound quality is excellent. Verified safe with VirusTotal before installing.',
        likes: 12,
        dislikes: 0,
        verifiedDownload: true
      }
    ]
  },
  {
    id: 'capcut-video-editor',
    title: 'CapCut - Video Editor',
    packageName: 'com.capcut.videoeditor',
    category: 'Media & Video',
    rating: 4.8,
    totalReviews: 14200000,
    downloadsCount: '500M+',
    downloadsNumeric: 500000000,
    icon: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=256&q=80',
    banner: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80',
    developer: 'Bytedance Pte. Ltd.',
    minAndroid: 'Android 8.0+',
    size: '115.8 MB',
    updatedDate: '2026-08-03',
    isVerified: true,
    isFeatured: true,
    isEditorChoice: true,
    isTrending: true,
    architecture: 'arm64-v8a',
    tags: ['Video Editing', 'AI Effects', 'Reels', 'TikTok', 'Transitions'],
    description: 'Free, easy-to-use video editor app with AI captions, background removal, and Trending templates.',
    longDescription: `CapCut is an official free Video Editor and Video Maker with Music for TikTok that is versatile and easy to use.

In addition to its basic features, such as video editing, text, stickers, filters, colors and music, CapCut offers free advanced features, including keyframe animation, smooth slow-motion effects, chroma key, Picture-in-Picture (PIP), and stabilization to help you capture and cut moments.`,
    screenshots: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80'
    ],
    safetyChecks: [
      { label: 'Google Play Protect', status: 'passed', description: 'Verified safe application package.' },
      { label: 'VirusTotal Clean', status: 'passed', description: 'Scanned 0 issues found across 72 antivirus engines.' },
      { label: 'Signature Integrity', status: 'passed', description: 'Valid Developer Certificate from Bytedance.' }
    ],
    versions: [
      {
        versionName: '11.8.0',
        versionCode: 118000,
        releaseDate: '2026-08-03',
        fileSize: '115.8 MB',
        minAndroid: 'Android 8.0+',
        sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        changelog: ['Upgraded AI Smart Tracking 3.0', 'New trending summer sound effects & templates', '4K 60fps export optimization'],
        downloadUrl: '#',
        isLatest: true
      },
      {
        versionName: '11.6.2',
        versionCode: 116200,
        releaseDate: '2026-07-10',
        fileSize: '112.4 MB',
        minAndroid: 'Android 8.0+',
        sha256: '5a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0',
        changelog: ['Added AI Auto Captions in 28 languages', 'Improved timeline zooming gestures'],
        downloadUrl: '#'
      }
    ],
    reviews: [
      {
        id: 'rev-3',
        userName: 'Maya Vance',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80',
        rating: 5,
        date: '2026-08-04',
        comment: 'Best editing APK ever! 4K export works like a charm on my Galaxy S24.',
        likes: 19,
        dislikes: 0,
        verifiedDownload: true
      }
    ]
  },
  {
    id: 'genshin-impact',
    title: 'Genshin Impact',
    packageName: 'com.miHoYo.GenshinImpact',
    category: 'Games',
    rating: 4.6,
    totalReviews: 5120000,
    downloadsCount: '100M+',
    downloadsNumeric: 100000000,
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=256&q=80',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    developer: 'COGNOSPHERE PTE. LTD.',
    minAndroid: 'Android 9.0+',
    size: '340.5 MB',
    updatedDate: '2026-07-29',
    isVerified: true,
    isFeatured: true,
    isEditorChoice: true,
    isTrending: true,
    architecture: 'arm64-v8a',
    tags: ['RPG', 'Open World', 'Anime', 'Adventure', 'Multiplayer'],
    description: 'Step into Teyvat, a vast world teeming with life and flowing with elemental energy.',
    longDescription: `Step into Teyvat, a fantasy world where the seven elements flow and converge. In the distant past, the Archons gave mortals unique elemental abilities. With such powers, humans built a bountiful homeland out of the wilderness.

Explore this wondrous open world, join forces with a diverse cast of characters, and unravel the countless mysteries that Teyvat holds.`,
    screenshots: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
    ],
    safetyChecks: [
      { label: 'Google Play Protect', status: 'passed', description: 'Clean installer package checked.' },
      { label: 'VirusTotal Clean', status: 'passed', description: 'No malware found in APK manifest.' },
      { label: 'Signature Integrity', status: 'passed', description: 'Official miHoYo / Cognosphere developer certificate.' }
    ],
    versions: [
      {
        versionName: '5.2.0',
        versionCode: 52000,
        releaseDate: '2026-07-29',
        fileSize: '340.5 MB',
        minAndroid: 'Android 9.0+',
        sha256: '4b227777d4dd1fc61c6f884f48641d02b4d21d3d9203673523297a73b22b2e59',
        changelog: ['New Region Unlocked: Natlan Highlands', '2 New 5-Star Characters Added', 'Vulkan graphics rendering optimization'],
        downloadUrl: '#',
        isLatest: true
      }
    ],
    reviews: [
      {
        id: 'rev-4',
        userName: 'Kenji Sato',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80',
        rating: 5,
        date: '2026-07-30',
        comment: 'Downloaded the xapk bundle installer here, installed cleanly with no error.',
        likes: 45,
        dislikes: 2,
        verifiedDownload: true
      }
    ]
  },
  {
    id: 'duolingo-language',
    title: 'Duolingo: Language Lessons',
    packageName: 'com.duolingo',
    category: 'Productivity',
    rating: 4.7,
    totalReviews: 18200000,
    downloadsCount: '500M+',
    downloadsNumeric: 500000000,
    icon: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=256&q=80',
    banner: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    developer: 'Duolingo',
    minAndroid: 'Android 8.0+',
    size: '42.3 MB',
    updatedDate: '2026-08-04',
    isVerified: true,
    isFeatured: false,
    isEditorChoice: true,
    isTrending: false,
    architecture: 'universal',
    tags: ['Education', 'Languages', 'Learning', 'English', 'Spanish'],
    description: 'Learn Spanish, French, German, Italian, English, and more languages with quick bite-sized lessons.',
    longDescription: `Learn a new language with the world's most-downloaded education app! Duolingo is the fun, free app for learning 40+ languages through quick, bite-sized lessons.

Practice speaking, reading, listening, and writing to build your vocabulary and grammar skills. Designed by language experts and loved by hundreds of millions of learners worldwide.`,
    screenshots: [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
    ],
    safetyChecks: [
      { label: 'Google Play Protect', status: 'passed', description: 'Scanned and verified.' },
      { label: 'VirusTotal Clean', status: 'passed', description: '0/70 detections.' },
      { label: 'Signature Integrity', status: 'passed', description: 'Valid Duolingo RSA Signature.' }
    ],
    versions: [
      {
        versionName: '5.148.4',
        versionCode: 51484,
        releaseDate: '2026-08-04',
        fileSize: '42.3 MB',
        minAndroid: 'Android 8.0+',
        sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        changelog: ['New Chess learning course unlocked', 'Enhanced streak freeze widget'],
        downloadUrl: '#',
        isLatest: true
      }
    ],
    reviews: []
  },
  {
    id: 'vlc-media-player',
    title: 'VLC for Android',
    packageName: 'org.videolan.vlc',
    category: 'Tools',
    rating: 4.5,
    totalReviews: 2100000,
    downloadsCount: '100M+',
    downloadsNumeric: 100000000,
    icon: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=256&q=80',
    banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    developer: 'VideoLAN',
    minAndroid: 'Android 5.0+',
    size: '38.6 MB',
    updatedDate: '2026-07-22',
    isVerified: true,
    isFeatured: false,
    isEditorChoice: true,
    isTrending: false,
    architecture: 'arm64-v8a, x86_64',
    tags: ['Video Player', 'Open Source', 'Codecs', 'Subtitles', 'Media'],
    description: 'VLC for Android is a full open source audio and video player, capable of playing any video and audio file format.',
    longDescription: `VLC for Android plays most local video and audio files, as well as network streams (including adaptive streaming), DVD ISOs, like the desktop version of VLC.

All formats are supported, including MKV, MP4, AVI, MOV, Ogg, FLAC, TS, M2TS, Wv and AAC. All codecs are included with no separate downloads. It supports subtitles, Teletext and Closed Captions.`,
    screenshots: [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
    ],
    safetyChecks: [
      { label: 'Google Play Protect', status: 'passed', description: 'Open source clean build.' },
      { label: 'VirusTotal Clean', status: 'passed', description: '0 detections.' },
      { label: 'Signature Integrity', status: 'passed', description: 'VideoLAN Official Key.' }
    ],
    versions: [
      {
        versionName: '3.5.7',
        versionCode: 3050700,
        releaseDate: '2026-07-22',
        fileSize: '38.6 MB',
        minAndroid: 'Android 5.0+',
        sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284ddd200126d9069d',
        changelog: ['Fixed SMB v3 playback stutter', 'Hardware acceleration tweaks for Android 15'],
        downloadUrl: '#',
        isLatest: true
      }
    ],
    reviews: []
  },
  {
    id: 'snapseed-photo-editor',
    title: 'Snapseed Photo Editor',
    packageName: 'com.niksoftware.snapseed',
    category: 'Photography',
    rating: 4.6,
    totalReviews: 1950000,
    downloadsCount: '100M+',
    downloadsNumeric: 100000000,
    icon: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=256&q=80',
    banner: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80',
    developer: 'Google LLC',
    minAndroid: 'Android 6.0+',
    size: '27.4 MB',
    updatedDate: '2026-06-18',
    isVerified: true,
    isFeatured: false,
    isEditorChoice: true,
    isTrending: false,
    architecture: 'universal',
    tags: ['Photo Editing', 'RAW', 'Filters', 'Curves', 'Google'],
    description: 'A complete and professional photo editor developed by Google with 29 tools and filters.',
    longDescription: `Snapseed is a complete and professional photo editor developed by Google.

Key Features:
- 29 Tools and Filters, including Healing, Brush, Structure, HDR, Perspective
- Opens JPG and RAW files
- Save your personal looks and apply them to new photos later
- Selective filter brush
- Fine control over brightness, exposure, contrast, and color curves`,
    screenshots: [
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=800&q=80'
    ],
    safetyChecks: [
      { label: 'Google Play Protect', status: 'passed', description: 'Official Google LLC app.' },
      { label: 'VirusTotal Clean', status: 'passed', description: '0/70 scanned safe.' },
      { label: 'Signature Integrity', status: 'passed', description: 'Google LLC Certificate.' }
    ],
    versions: [
      {
        versionName: '2.21.0.420',
        versionCode: 22100420,
        releaseDate: '2026-06-18',
        fileSize: '27.4 MB',
        minAndroid: 'Android 6.0+',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        changelog: ['RAW image decoder update for latest camera sensors', 'Bug fixes'],
        downloadUrl: '#',
        isLatest: true
      }
    ],
    reviews: []
  },
  {
    id: 'cx-file-explorer',
    title: 'Cx File Explorer',
    packageName: 'com.cxinventor.fileexplorer',
    category: 'Utilities',
    rating: 4.8,
    totalReviews: 890000,
    downloadsCount: '50M+',
    downloadsNumeric: 50000000,
    icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80',
    banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    developer: 'Cx Inventor',
    minAndroid: 'Android 5.0+',
    size: '12.8 MB',
    updatedDate: '2026-07-11',
    isVerified: true,
    isFeatured: false,
    isEditorChoice: true,
    isTrending: false,
    architecture: 'universal',
    tags: ['File Manager', 'FTP', 'Cloud Storage', 'Storage Analyzer', 'Clean UI'],
    description: 'Powerful file manager app with a clean and intuitive interface, storage analysis, and cloud backup.',
    longDescription: `Cx File Explorer is a powerful file manager app with a clean and intuitive interface. With this file manager app, you can quickly browse and manage the files on your mobile device, PC, and cloud storage, just like you use Windows Explorer or Finder on your PC or Mac.`,
    screenshots: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
    ],
    safetyChecks: [
      { label: 'Google Play Protect', status: 'passed', description: 'Scanned safe.' },
      { label: 'VirusTotal Clean', status: 'passed', description: '0 detections.' },
      { label: 'Signature Integrity', status: 'passed', description: 'Valid Signature.' }
    ],
    versions: [
      {
        versionName: '2.1.2',
        versionCode: 20102,
        releaseDate: '2026-07-11',
        fileSize: '12.8 MB',
        minAndroid: 'Android 5.0+',
        sha256: '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        changelog: ['Added WebDAV cloud protocol support', 'Faster storage breakdown visualization'],
        downloadUrl: '#',
        isLatest: true
      }
    ],
    reviews: []
  },
  {
    id: 'subway-surfers',
    title: 'Subway Surfers',
    packageName: 'com.kiloo.subwaysurf',
    category: 'Games',
    rating: 4.6,
    totalReviews: 39100000,
    downloadsCount: '1B+',
    downloadsNumeric: 1000000000,
    icon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=256&q=80',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    developer: 'SYBO Games',
    minAndroid: 'Android 6.0+',
    size: '148.2 MB',
    updatedDate: '2026-08-02',
    isVerified: true,
    isFeatured: true,
    isEditorChoice: false,
    isTrending: true,
    architecture: 'arm64-v8a',
    tags: ['Runner', 'Arcade', 'Action', 'Offline', 'Casual'],
    description: 'DASH as fast as you can! DODGE the oncoming trains! Help Jake, Tricky & Fresh escape from the grumpy Inspector.',
    longDescription: `Join the World Tour in Tokyo! Race through neon-lit streets, dodge bullet trains, collect hoverboards, and unlock special limited edition surfers!`,
    screenshots: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
    ],
    safetyChecks: [
      { label: 'Google Play Protect', status: 'passed', description: 'Clean APK file.' },
      { label: 'VirusTotal Clean', status: 'passed', description: '0/68 detections.' },
      { label: 'Signature Integrity', status: 'passed', description: 'SYBO Games Developer Certificate.' }
    ],
    versions: [
      {
        versionName: '3.32.0',
        versionCode: 33200,
        releaseDate: '2026-08-02',
        fileSize: '148.2 MB',
        minAndroid: 'Android 6.0+',
        sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        changelog: ['Subway Surfers World Tour Tokyo 2026', 'New Hoverboard: Cyber Blade', 'Bug fixes'],
        downloadUrl: '#',
        isLatest: true
      }
    ],
    reviews: []
  }
];

export const INITIAL_REQUESTS: AppRequest[] = [
  {
    id: 'req-1',
    title: 'Kinemaster Pro 2026',
    developer: 'KineMaster Corporation',
    category: 'Media & Video',
    note: 'Please update to latest version 7.4 with 4K 60fps unlocked support.',
    votes: 142,
    requestedBy: 'User_Gamer99',
    date: '2026-08-01',
    status: 'pending'
  },
  {
    id: 'req-2',
    title: 'Termux Terminal Emulator',
    developer: 'Fredrik Fornwall',
    category: 'Tools',
    note: 'Requesting F-Droid build v0.118 with glibc package repo pre-configured.',
    votes: 98,
    requestedBy: 'DevRider',
    date: '2026-07-28',
    status: 'pending'
  },
  {
    id: 'req-3',
    title: 'Clash Royale v5.2',
    developer: 'Supercell',
    category: 'Games',
    note: 'Update requested for the latest Goblin Queen season update.',
    votes: 215,
    requestedBy: 'RoyaleKing',
    date: '2026-08-03',
    status: 'pending'
  }
];
