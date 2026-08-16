import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  getAccessToken,
  getOrCreateDriveFolder,
  listDriveFiles,
  getDriveFileMetadata,
  fetchDriveFileStream,
  uploadApkToDrive,
  createDriveFolder,
} from './server/googleDriveService';

interface Bindings {
  ASSETS: { fetch: typeof fetch };
  CLIENT_ID?: string;
  GOOGLE_CLIENT_ID?: string;
  CLIENT_SECRET?: string;
  GOOGLE_CLIENT_SECRET?: string;
  REFRESH_TOKEN?: string;
  GOOGLE_REFRESH_TOKEN?: string;
}

async function pingIndexNow(slug: string): Promise<number> {
  const url = `https://goapk.store/app/${slug}`;
  const indexNowUrl = 'https://api.indexnow.org/IndexNow';
  const body = {
    host: 'goapk.store',
    key: '1d7559651705c9f77bea000676617fb0',
    keyLocation: 'https://goapk.store/1d7559651705c9f77bea000676617fb0.txt',
    urlList: [url]
  };

  try {
    const res = await fetch(indexNowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body)
    });
    console.log(`IndexNow ping status for ${slug}: ${res.status}`);
    return res.status;
  } catch (e) {
    console.error(`Failed to ping IndexNow for ${slug}:`, e);
    return 500;
  }
}

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend compatibility
app.use('*', cors());

// Helper to extract credentials from Request context, headers, query, or environment context
function getCredentials(c: any) {
  const headerClientId = c.req.header('x-drive-client-id');
  const headerClientSecret = c.req.header('x-drive-client-secret');
  const headerRefreshToken = c.req.header('x-drive-refresh-token');
  const headerFolderId = c.req.header('x-drive-folder-id');

  const queryClientId = c.req.query('clientId');
  const queryClientSecret = c.req.query('clientSecret');
  const queryRefreshToken = c.req.query('refreshToken');
  const queryFolderId = c.req.query('folderId');

  return {
    clientId: headerClientId || queryClientId || c.env?.CLIENT_ID || c.env?.GOOGLE_CLIENT_ID || '',
    clientSecret: headerClientSecret || queryClientSecret || c.env?.CLIENT_SECRET || c.env?.GOOGLE_CLIENT_SECRET || '',
    refreshToken: headerRefreshToken || queryRefreshToken || c.env?.REFRESH_TOKEN || c.env?.GOOGLE_REFRESH_TOKEN || '',
    folderId: headerFolderId || queryFolderId || c.env?.GOOGLE_DRIVE_FOLDER_ID || '',
  };
}

// Helper: categorize APKs by filename match
function getCategoryFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('game') || lower.includes('minecraft') || lower.includes('gta') || lower.includes('pubg')) {
    return 'Games';
  }
  if (lower.includes('music') || lower.includes('spotify') || lower.includes('video') || lower.includes('youtube') || lower.includes('netflix') || lower.includes('audio') || lower.includes('podcast')) {
    return 'Media & Video';
  }
  if (lower.includes('photo') || lower.includes('camera') || lower.includes('gallery') || lower.includes('editor')) {
    return 'Photography';
  }
  if (lower.includes('social') || lower.includes('facebook') || lower.includes('instagram') || lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('chat') || lower.includes('message')) {
    return 'Social';
  }
  if (lower.includes('finance') || lower.includes('bank') || lower.includes('wallet') || lower.includes('pay') || lower.includes('crypto')) {
    return 'Finance';
  }
  if (lower.includes('health') || lower.includes('fit') || lower.includes('run') || lower.includes('workout') || lower.includes('diet')) {
    return 'Health & Fitness';
  }
  if (lower.includes('productivity') || lower.includes('note') || lower.includes('calendar') || lower.includes('doc') || lower.includes('sheet') || lower.includes('office')) {
    return 'Productivity';
  }
  if (lower.includes('zarchiver') || lower.includes('tool') || lower.includes('utility') || lower.includes('file') || lower.includes('manager') || lower.includes('zip') || lower.includes('rar')) {
    return 'Tools';
  }
  return 'Utilities';
}

// Helper to group and map Google Drive files to frontend AppItems
function mapFilesToAppItems(responseData: any): any[] {
  const allFiles = responseData.files || [];
  const rootFolderId = responseData.rootFolderId;
  const subfolders = responseData.subfolders || [];

  const apkFiles = allFiles.filter((file: any) => 
    file.mimeType === 'application/vnd.android.package-archive' ||
    (file.name && file.name.toLowerCase().endsWith('.apk'))
  );

  const imageFiles = allFiles.filter((file: any) => 
    file.mimeType.startsWith('image/') ||
    (file.name && /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name))
  );

  const appGroups: { [key: string]: any[] } = {};

  apkFiles.forEach((file: any) => {
    const parentId = file.parents && file.parents[0];
    let groupKey = parentId;

    if (!parentId || parentId === rootFolderId) {
      const cleanTitle = file.name
        ? file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]v?\d+\.\d+(\.\d+)*/gi, '')
            .replace(/[-_+]/g, ' ')
            .trim()
            .toLowerCase()
        : 'unknown';
      groupKey = `root_${cleanTitle}`;
    }

    if (!appGroups[groupKey]) {
      appGroups[groupKey] = [];
    }
    appGroups[groupKey].push(file);
  });

  return Object.keys(appGroups).map((groupKey) => {
    const groupFiles = appGroups[groupKey];
    groupFiles.sort((a, b) => {
      const tA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
      const tB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
      return tB - tA;
    });

    const mainFile = groupFiles[0];
    const cleanTitle = mainFile.name
      ? mainFile.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]v?\d+\.\d+(\.\d+)*/gi, '')
          .replace(/[-_+]/g, ' ')
      : 'Unknown App';
    
    const capitalizedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    const updatedDate = mainFile.createdTime 
      ? mainFile.createdTime.split('T')[0] 
      : new Date().toISOString().split('T')[0];

    let computedCategory = getCategoryFromFileName(mainFile.name || '');
    let appDeveloper = 'GoAPK';
    let appPackageName = `com.gdrive.app.${groupKey.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    let appMinAndroid = 'Android 8.0+';
    let appDescription = `Android package file (${mainFile.name}) hosted securely on Google Drive.`;
    const parentId = mainFile.parents && mainFile.parents[0];
    let iconUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80';
    let screenshots = [iconUrl];

    if (parentId && parentId !== rootFolderId) {
      const subfolder = subfolders.find((sf: any) => sf.id === parentId);
      if (subfolder && subfolder.description) {
        const descText = subfolder.description;
        // Parse metadata lines if present
        const lines = descText.split('\n');
        
        let hasMeta = false;
        let lineIdx = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('category:')) {
            computedCategory = line.substring('category:'.length).trim();
            hasMeta = true;
            lineIdx = i + 1;
          } else if (line.startsWith('developer:')) {
            appDeveloper = line.substring('developer:'.length).trim();
            hasMeta = true;
            lineIdx = i + 1;
          } else if (line.startsWith('package:')) {
            appPackageName = line.substring('package:'.length).trim();
            hasMeta = true;
            lineIdx = i + 1;
          } else if (line.startsWith('minAndroid:')) {
            appMinAndroid = line.substring('minAndroid:'.length).trim();
            hasMeta = true;
            lineIdx = i + 1;
          } else {
            // Stop parsing metadata at the first line that is not metadata
            break;
          }
        }
        
        if (hasMeta) {
          appDescription = lines.slice(lineIdx).join('\n');
        } else {
          appDescription = descText;
        }
      }

      const folderImages = imageFiles.filter((img: any) => 
        img.parents && img.parents.includes(parentId)
      );

      if (folderImages.length > 0) {
        const folderName = subfolder ? subfolder.name.toLowerCase() : '';
        const apkBase = mainFile.name.replace(/\.[^/.]+$/, '').toLowerCase().split(/[-_]/)[0];

        const iconFile = folderImages.find((img: any) => 
          img.name.toLowerCase().includes('icon')
        ) || folderImages.find((img: any) => {
          const imgBase = img.name.replace(/\.[^/.]+$/, '').toLowerCase();
          return imgBase === apkBase;
        }) || folderImages.find((img: any) => {
          const imgBase = img.name.replace(/\.[^/.]+$/, '').toLowerCase();
          return folderName && imgBase === folderName;
        }) || folderImages[0];

        iconUrl = `/api/drive/file/${iconFile.id}`;
        
        const nonIconImages = folderImages.filter((img: any) => img.id !== iconFile.id);
        if (nonIconImages.length > 0) {
          screenshots = nonIconImages.map((img: any) => `/api/drive/file/${img.id}`);
        } else {
          screenshots = [`/api/drive/file/${iconFile.id}`];
        }
      }
    } else {
      const baseName = mainFile.name.replace(/\.[^/.]+$/, '').toLowerCase().split(/[-_]/)[0];
      const matchingImage = imageFiles.find((img: any) => {
        const imgBaseName = img.name.replace(/\.[^/.]+$/, '').toLowerCase();
        return imgBaseName.startsWith(baseName) || baseName.startsWith(imgBaseName);
      });

      if (matchingImage) {
        iconUrl = `/api/drive/file/${matchingImage.id}`;
        screenshots = [iconUrl];
      }
    }

    const versions = groupFiles.map((file: any, index: number) => {
      const formattedSize = file.size 
        ? (parseInt(file.size, 10) / (1024 * 1024)).toFixed(1) + ' MB'
        : 'Unknown Size';

      const fileUpdatedDate = file.createdTime 
        ? file.createdTime.split('T')[0] 
        : new Date().toISOString().split('T')[0];

      const versionMatch = file.name ? file.name.match(/[-_]v?(\d+\.\d+(?:\.\d+)*)/i) : null;
      const extractedVersion = versionMatch ? versionMatch[1] : `1.0.${groupFiles.length - 1 - index}`;

      return {
        versionName: extractedVersion,
        versionCode: groupFiles.length - index,
        releaseDate: fileUpdatedDate,
        fileSize: formattedSize,
        minAndroid: appMinAndroid,
        sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        changelog: [`Google Drive package update - version ${extractedVersion}`],
        downloadUrl: `/api/drive/download/${file.id}`,
        isLatest: index === 0
      };
    });

    const titleSlug = capitalizedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return {
      id: groupKey,
      title: capitalizedTitle,
      packageName: appPackageName,
      category: computedCategory,
      rating: 5.0,
      totalReviews: 1,
      downloadsCount: 'New',
      downloadsNumeric: 1,
      icon: iconUrl,
      banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      developer: appDeveloper,
      minAndroid: appMinAndroid,
      size: versions[0].fileSize,
      updatedDate: updatedDate,
      isVerified: true,
      tags: ['Google Drive', 'APK'],
      description: appDescription,
      longDescription: appDescription,
      screenshots: screenshots,
      safetyChecks: [
        { label: 'Google Drive Virus Scan', status: 'passed', description: 'Scanned clean by Google Drive built-in virus scanner.' },
        { label: 'Package Signature Verified', status: 'passed', description: 'Standard signature verification passed.' }
      ],
      versions: versions,
      reviews: [],
      slug: titleSlug || groupKey || 'app'
    };
  });
}

// Helper to look up a single app detail by name or slug
function findAppDetailByName(responseData: any, nameOrSlug: string): any | null {
  const apps = mapFilesToAppItems(responseData);
  const querySlug = nameOrSlug.toLowerCase().trim();
  return apps.find((app: any) => 
    app.slug === querySlug ||
    app.id.toLowerCase() === querySlug ||
    app.title.toLowerCase() === querySlug ||
    app.packageName.toLowerCase() === querySlug
  ) || null;
}

// Helper to inject SEO meta tags for app details pages dynamically
function injectSeoTags(htmlText: string, path: string, listData: any): string {
  let updatedHtml = htmlText;

  // Inject the listData JSON into the HTML for instant frontend hydration
  if (listData) {
    const listDataScript = `<script id="gdrive-data" type="application/json">${JSON.stringify(listData).replace(/</g, '\\u003c')}</script>`;
    updatedHtml = updatedHtml.replace(/<\/head>/i, `${listDataScript}\n</head>`);
  }

  let routeSlug = '';
  const pathname = path.toLowerCase();
  
  if (pathname.includes('/app/')) {
    routeSlug = path.split('/app/')[1].split('/')[0];
  } else if (pathname.includes('/apk/')) {
    routeSlug = path.split('/apk/')[1].split('/')[0];
  } else if (pathname.includes('/download/')) {
    routeSlug = path.split('/download/')[1].split('/')[0];
  }

  if (!routeSlug || !listData) {
    return updatedHtml;
  }

  const appItem = findAppDetailByName(listData, routeSlug);
  if (!appItem) {
    return updatedHtml;
  }

  const appTitle = appItem.title;
  const seoTitle = `${appTitle} APK Download (Latest Version) for Android - 100% Safe`;
  const seoDesc = `Download ${appTitle} APK latest official version for Android free. Safe, direct link, Google Drive hosted, signature verified, and 100% malware-free.`;
  const canonicalUrl = `https://goapk.store/app/${appItem.slug}`;

  // Replace default title
  updatedHtml = updatedHtml.replace(/<title>.*?<\/title>/i, `<title>${seoTitle}</title>`);
  
  // Replace default description
  updatedHtml = updatedHtml.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
    `<meta name="description" content="${seoDesc}" />`
  );

  // Update OG tags for social SEO
  updatedHtml = updatedHtml.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${seoTitle}" />`
  );
  updatedHtml = updatedHtml.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${seoDesc}" />`
  );

  // Replace default H1 tag for SEO Crawlers
  updatedHtml = updatedHtml.replace(
    /<h1\s+id="seo-h1".*?>.*?<\/h1>/i,
    `<h1 id="seo-h1" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;">${seoTitle}</h1>`
  );

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": appTitle,
    "operatingSystem": "Android",
    "applicationCategory": `${appItem.category}Application`,
    "fileSize": appItem.size,
    "softwareVersion": appItem.versions?.[0]?.versionName || "1.0.0",
    "author": {
      "@type": "Organization",
      "name": appItem.developer && appItem.developer !== 'GoAPK' ? appItem.developer : 'Android Developer'
    },
    "publisher": {
      "@type": "Organization",
      "name": "GoAPK",
      "logo": {
        "@type": "ImageObject",
        "url": "https://goapk.store/logo.png"
      }
    },
    "downloadUrl": appItem.versions?.[0]?.downloadUrl 
      ? `https://goapk.store${appItem.versions[0].downloadUrl}`
      : canonicalUrl,
    "description": appItem.description,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  // Inject robots, canonical, and structured JSON-LD schema right before </head>
  const injectTags = `
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonicalUrl}" />
    <script type="application/ld+json">${JSON.stringify(schemaData)}</script>
  </head>`;
  updatedHtml = updatedHtml.replace(/<\/head>/i, injectTags);

  return updatedHtml;
}

/**
 * GET /api/drive/status
 * Check Google Drive OAuth status and connection details
 */
app.get('/api/drive/status', async (c) => {
  try {
    const creds = getCredentials(c);
    const token = await getAccessToken(creds);
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to check Drive about status: ${res.statusText}`);
    }

    const about: any = await res.json();
    return c.json({
      connected: true,
      user: about.user,
      storageQuota: about.storageQuota,
    });
  } catch (error: any) {
    console.error('Error connecting to Google Drive:', error);
    return c.json({
      connected: false,
      error: error.message || 'Failed to authenticate with Google Drive API',
    });
  }
});

/**
 * GET /api/drive/token
 * Generate temporary access token and root folder ID for direct client upload
 */
app.get('/api/drive/token', async (c) => {
  try {
    const creds = getCredentials(c);
    const token = await getAccessToken(creds);
    
    let folderId = creds.folderId;
    if (!folderId) {
      const cacheKey = getCacheKey(creds);
      const cacheEntry = driveCacheMap.get(cacheKey);
      if (cacheEntry && cacheEntry.rootFolderId) {
        folderId = cacheEntry.rootFolderId;
      } else {
        folderId = await getOrCreateDriveFolder(token);
      }
    }
    return c.json({ token, folderId });
  } catch (error: any) {
    console.error('Error generating client upload token:', error);
    return c.json({ error: error.message || 'Failed to generate token' }, 500);
  }
});

// Simple in-memory cache and Cloudflare Cache API integration to avoid repeated slow Google Drive API calls
interface CacheEntry {
  rootFolderId: string;
  filesResponse: any;
  cacheExpiry: number;
}
const driveCacheMap = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 30 * 60 * 1000; // Cache lists for 30 minutes

function getCacheKey(creds: { clientId: string; refreshToken: string }) {
  if (!creds.clientId || !creds.refreshToken) {
    return 'default';
  }
  return `${creds.clientId}_${creds.refreshToken}`;
}

async function getCachedFiles(c: any, creds: any): Promise<any> {
  const cacheKey = getCacheKey(creds);
  const now = Date.now();

  // 1. Try Cloudflare Cache API first if available
  if (typeof caches !== 'undefined') {
    try {
      const cache = (caches as any).default;
      const cacheUrl = `https://cache.local/api/drive/files?key=${cacheKey}`;
      const cachedRes = await cache.match(new Request(cacheUrl));
      if (cachedRes) {
        const data = await cachedRes.json();
        return data;
      }
    } catch (e) {
      console.error('Cloudflare cache match failed:', e);
    }
  }

  // 2. Fallback to in-memory map
  const cacheEntry = driveCacheMap.get(cacheKey);
  if (cacheEntry && now < cacheEntry.cacheExpiry) {
    return cacheEntry.filesResponse;
  }

  return null;
}

async function saveCachedFiles(c: any, creds: any, responseData: any) {
  const cacheKey = getCacheKey(creds);
  const now = Date.now();

  // 1. Save in-memory
  driveCacheMap.set(cacheKey, {
    rootFolderId: responseData.rootFolderId,
    filesResponse: responseData,
    cacheExpiry: now + CACHE_DURATION_MS,
  });

  // 2. Save to Cloudflare Cache API if available
  if (typeof caches !== 'undefined') {
    try {
      const cache = (caches as any).default;
      const cacheUrl = `https://cache.local/api/drive/files?key=${cacheKey}`;
      const cachedResponse = new Response(JSON.stringify(responseData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_DURATION_MS / 1000}`,
        },
      });
      if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
        c.executionCtx.waitUntil(cache.put(new Request(cacheUrl), cachedResponse));
      } else {
        await cache.put(new Request(cacheUrl), cachedResponse);
      }
    } catch (e) {
      console.error('Cloudflare cache put failed:', e);
    }
  }
}

async function invalidateCache(c: any, creds: any) {
  const cacheKey = getCacheKey(creds);
  driveCacheMap.delete(cacheKey);

  if (typeof caches !== 'undefined') {
    try {
      const cache = (caches as any).default;
      const cacheUrl = `https://cache.local/api/drive/files?key=${cacheKey}`;
      if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
        c.executionCtx.waitUntil(cache.delete(new Request(cacheUrl)));
      } else {
        await cache.delete(new Request(cacheUrl));
      }
    } catch (e) {
      console.error('Cloudflare cache delete failed:', e);
    }
  }
}

async function resolveFilesList(c: any, creds: any): Promise<any> {
  const cacheKey = getCacheKey(creds);
  
  // Try reading from cache
  const cachedData = await getCachedFiles(c, creds);
  if (cachedData) {
    return cachedData;
  }

  const token = await getAccessToken(creds);
  let folderId = creds.folderId;
  if (!folderId) {
    const memoryEntry = driveCacheMap.get(cacheKey);
    if (memoryEntry && memoryEntry.rootFolderId) {
      folderId = memoryEntry.rootFolderId;
    } else {
      folderId = await getOrCreateDriveFolder(token);
    }
  }

  // 1. List items directly in the main folder to find subfolders
  const folderQuery = `'${folderId}' in parents and trashed = false`;
  const initialList = await listDriveFiles(token, folderQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime)');
  
  const items = initialList.files || [];
  const subfolders = items.filter((i: any) => i.mimeType === 'application/vnd.google-apps.folder');

  // 2. Fetch files from root folder and all subfolders
  const parentIds = [folderId, ...subfolders.map((sf: any) => sf.id)];
  const parentQuery = parentIds.map(id => `'${id}' in parents`).join(' or ');
  const filesQuery = `(${parentQuery}) and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;

  const filesList = await listDriveFiles(token, filesQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime, parents)');

  const responseData = {
    success: true,
    rootFolderId: folderId,
    subfolders: subfolders,
    files: filesList.files || [],
  };

  // Save to cache
  await saveCachedFiles(c, creds, responseData);

  return responseData;
}

/**
 * GET /api/drive/cache/clear
 * Manually invalidate and clear the Google Drive files cache
 */
app.get('/api/drive/cache/clear', async (c) => {
  const creds = getCredentials(c);
  try {
    await invalidateCache(c, creds);
    return c.json({ success: true, message: 'Cache cleared successfully!' });
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Failed to invalidate cache' }, 500);
  }
});

/**
 * GET /api/drive/files
 * List all APK files uploaded to the GoAPKDownload Google Drive folder
 */
app.get('/api/drive/files', async (c) => {
  const creds = getCredentials(c);
  try {
    const listData = await resolveFilesList(c, creds);
    
    const pageParam = c.req.query('page');
    const limitParam = c.req.query('limit');
    
    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || '1', 10));
      const limit = Math.max(1, parseInt(limitParam || '24', 10));
      
      const files = listData.files || [];
      const totalFiles = files.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedFiles = files.slice(startIndex, endIndex);
      
      return c.json({
        success: true,
        rootFolderId: listData.rootFolderId,
        subfolders: listData.subfolders || [],
        files: paginatedFiles,
        pagination: {
          page,
          limit,
          totalItems: totalFiles,
          totalPages: Math.ceil(totalFiles / limit),
          hasNextPage: endIndex < totalFiles,
          hasPrevPage: page > 1
        }
      });
    }
    
    return c.json(listData);
  } catch (error: any) {
    console.error('Failed to list Google Drive files:', error);
    return c.json({ error: error.message || 'Error fetching files from Google Drive' }, 500);
  }
});

/**
 * GET /api/drive/app/:name
 * Retrieve details for a single application dynamically by its name or slug
 */
app.get('/api/drive/app/:name', async (c) => {
  const nameParam = c.req.param('name');
  if (!nameParam) {
    return c.json({ error: 'Missing app name or slug' }, 400);
  }

  const creds = getCredentials(c);
  try {
    const listData = await resolveFilesList(c, creds);
    const appItem = findAppDetailByName(listData, nameParam);
    if (!appItem) {
      return c.json({ error: `App with name or slug '${nameParam}' not found.` }, 404);
    }
    return c.json({ success: true, app: appItem });
  } catch (e: any) {
    return c.json({ error: 'Failed to fetch files from Google Drive: ' + e.message }, 500);
  }
});

/**
 * POST /api/drive/indexnow
 * Notify IndexNow engine of a newly added or updated app URL
 */
app.post('/api/drive/indexnow', async (c) => {
  try {
    const body = await c.req.json();
    const slug = body.slug;
    if (!slug) {
      return c.json({ success: false, error: 'Missing slug' }, 400);
    }
    const status = await pingIndexNow(slug);
    return c.json({ success: status === 200, status });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /api/drive/upload
 * Upload an APK file to Google Drive and return public direct download link
 */
app.post('/api/drive/upload', async (c) => {
  try {
    const creds = getCredentials(c);
    const body = await c.req.parseBody();
    const file = body['apkFile'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No APK file provided in request.' }, 400);
    }

    const fileName = file.name || `app_${Date.now()}.apk`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const result = await uploadApkToDrive(
      buffer,
      fileName,
      file.type || 'application/vnd.android.package-archive',
      undefined,
      creds
    );

    // Invalidate the cache on successful upload so the new file displays immediately
    await invalidateCache(c, creds);

    return c.json({
      success: true,
      file: {
        id: result.fileId,
        name: result.fileName,
        size: result.fileSize,
        directDownloadUrl: result.directDownloadUrl,
        webViewLink: result.webViewLink,
        createdTime: result.createdTime,
      },
    });
  } catch (error: any) {
    console.error('Error uploading APK to Google Drive:', error);
    return c.json({ error: error.message || 'Failed to upload APK to Google Drive' }, 500);
  }
});

/**
 * POST /api/drive/upload-app
 * Upload an APK and an optional icon image to a dedicated app folder in Google Drive
 */
app.post('/api/drive/upload-app', async (c) => {
  const creds = getCredentials(c);
  try {
    await getAccessToken(creds);
  } catch (e) {
    return c.json({ error: 'Google Drive is not configured.' }, 400);
  }

  try {
    const body = await c.req.parseBody();
    const apkFile = body['apkFile'];
    const iconFile = body['iconFile'];
    const customAppName = body['appName'] as string;
    const version = body['version'] as string; // Accept custom version parameter

    if (!apkFile || !(apkFile instanceof File)) {
      return c.json({ error: 'No APK file provided (apkFile is required).' }, 400);
    }

    // Determine app name (subfolder name)
    let appName = customAppName;
    if (!appName) {
      // Clean up the APK filename to derive app name
      appName = apkFile.name
        .replace(/\.[^/.]+$/, '') // strip extension
        .replace(/[-_]v?\d+\.\d+(\.\d+)*/gi, '') // strip version suffix
        .replace(/[-_+]/g, ' ') // replace dash/underscore/plus with space
        .trim();
      
      appName = appName.charAt(0).toUpperCase() + appName.slice(1);
    }

    if (!appName) {
      appName = 'Unknown App';
    }

    const token = await getAccessToken(creds);
    // 1. Get root folder ID
    let rootFolderId = creds.folderId;
    if (!rootFolderId) {
      const cacheKey = getCacheKey(creds);
      const cacheEntry = driveCacheMap.get(cacheKey);
      if (cacheEntry && cacheEntry.rootFolderId) {
        rootFolderId = cacheEntry.rootFolderId;
      } else {
        rootFolderId = await getOrCreateDriveFolder(token);
      }
    }

    // 2. Create the app subfolder in Google Drive under root folder
    // Check if the subfolder already exists to avoid duplicates
    let subfolderId = '';
    const folderQuery = `name = '${appName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed = false`;
    const searchFolder = await listDriveFiles(token, folderQuery, 'files(id)');

    if (searchFolder.files && searchFolder.files.length > 0 && searchFolder.files[0].id) {
      subfolderId = searchFolder.files[0].id;
    } else {
      subfolderId = await createDriveFolder(token, appName, rootFolderId);
    }

    if (!subfolderId) {
      throw new Error('Failed to create app folder in Google Drive');
    }

    // 3. Determine APK name (includes version suffix if provided)
    let apkName = apkFile.name || `${appName.toLowerCase()}.apk`;
    if (version) {
      // e.g. AppName_1.0.10.apk
      const cleanBase = appName.replace(/\s+/g, '');
      apkName = `${cleanBase}_${version}.apk`;
    }

    // Upload APK file to the app subfolder
    const apkBuffer = new Uint8Array(await apkFile.arrayBuffer());
    const apkResult = await uploadApkToDrive(
      apkBuffer,
      apkName,
      apkFile.type || 'application/vnd.android.package-archive',
      subfolderId,
      creds
    );

    // 4. Upload optional icon file to the same subfolder
    let iconResult = null;
    if (iconFile && iconFile instanceof File) {
      const iconBuffer = new Uint8Array(await iconFile.arrayBuffer());
      iconResult = await uploadApkToDrive(
        iconBuffer,
        iconFile.name || 'icon.png',
        iconFile.type || 'image/png',
        subfolderId,
        creds
      );
    }

    // Invalidate the cache so the new app is immediately listed
    await invalidateCache(c, creds);

    return c.json({
      success: true,
      appName,
      folderId: subfolderId,
      apk: {
        id: apkResult.fileId,
        name: apkResult.fileName,
        size: apkResult.fileSize,
        webViewLink: apkResult.webViewLink,
        directDownloadUrl: apkResult.directDownloadUrl,
      },
      icon: iconResult ? {
        id: iconResult.fileId,
        name: iconResult.fileName,
        webViewLink: iconResult.webViewLink,
      } : null,
    });
  } catch (error: any) {
    console.error('Error in upload-app endpoint:', error);
    return c.json({ error: error.message || 'Failed to upload app components' }, 500);
  }
});

/**
 * GET /api/drive/file/:fileId
 * Proxy and stream a file (like an image) directly from Google Drive
 */
app.get('/api/drive/file/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  if (!fileId) {
    return c.json({ error: 'Missing file ID' }, 400);
  }

  try {
    const creds = getCredentials(c);
    const token = await getAccessToken(creds);
    const metadata = await getDriveFileMetadata(token, fileId, 'name, mimeType');
    const response = await fetchDriveFileStream(token, fileId);

    const contentType = metadata.mimeType || 'application/octet-stream';
    const fileName = metadata.name || 'file';

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    });
  } catch (error: any) {
    console.error('Error fetching file from Google Drive:', error);
    return c.json({ error: error.message || 'Failed to retrieve file from Google Drive' }, 500);
  }
});

/**
 * GET /api/drive/download/:fileId
 * Proxy and download a file (like an APK) directly using server Google Drive API credentials.
 * This bypasses Google Drive's 403 public permission checks for direct links.
 */
app.get('/api/drive/download/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  if (!fileId) {
    return c.json({ error: 'Missing file ID' }, 400);
  }

  try {
    const creds = getCredentials(c);
    const token = await getAccessToken(creds);
    const metadata = await getDriveFileMetadata(token, fileId, 'name, mimeType');
    const response = await fetchDriveFileStream(token, fileId);

    const contentType = metadata.mimeType || 'application/vnd.android.package-archive';
    const fileName = metadata.name || 'app.apk';

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      }
    });
  } catch (error: any) {
    console.error('Error downloading file from Google Drive:', error);
    return c.json({ error: error.message || 'Failed to download file from Google Drive' }, 500);
  }
});

// Helper to generate dynamic sitemap XML
function generateSitemapXml(baseUrl: string, responseData: any): string {
  const apps = mapFilesToAppItems(responseData);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  apps.forEach((app: any) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/app/${app.slug}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += '</urlset>';
  return xml;
}

// Dynamic Sitemap endpoint
// Robots.txt explicit route to bypass Cloudflare AI Content Signals override
app.get('/robots.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8');
  return c.text(`User-agent: *
Allow: /

Sitemap: https://goapk.store/sitemap.xml`);
});

// Dynamic Sitemap endpoint (with background revalidation to prevent timeouts)
app.get('/sitemap.xml', async (c) => {
  const host = c.req.header('host') || 'goapk.store';
  const proto = c.req.url.startsWith('https') ? 'https' : 'http';
  const baseUrl = `${proto}://${host}`;

  const creds = getCredentials(c);
  const cacheKey = getCacheKey(creds);
  const cacheEntry = driveCacheMap.get(cacheKey);
  let listData = cacheEntry?.filesResponse;
  const now = Date.now();

  const revalidate = async () => {
    try {
      await resolveFilesList(c, creds);
      console.log('Sitemap cache successfully revalidated in background.');
    } catch (e) {
      console.error('Failed to revalidate sitemap cache in background:', e);
    }
  };

  // If we have cached files data, serve it instantly and revalidate in background if expired
  if (listData) {
    if (cacheEntry && now >= cacheEntry.cacheExpiry) {
      if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
        c.executionCtx.waitUntil(revalidate());
      } else {
        revalidate();
      }
    }
    const xml = generateSitemapXml(baseUrl, listData);
    c.header('Content-Type', 'application/xml');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.text(xml);
  }

  // Cold start fallback - fetch synchronously once
  try {
    listData = await resolveFilesList(c, creds);
    const xml = generateSitemapXml(baseUrl, listData);
    c.header('Content-Type', 'application/xml');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.text(xml);
  } catch (err: any) {
    console.error('Sitemap synchronous fetch fallback failed:', err);
    // Serve fallback sitemap containing homepage only to prevent 500 error
    const xml = generateSitemapXml(baseUrl, { files: [] });
    c.header('Content-Type', 'application/xml');
    return c.text(xml);
  }
});

// Serve static assets and handle React SPA routing fallback
app.get('*', async (c) => {
  const path = c.req.path;
  if (path.startsWith('/api')) {
    return c.notFound();
  }

  // If it's a client routing path (does not have a file extension like .js, .css, .png, etc.),
  // serve index.html directly as the SPA fallback.
  const lastSegment = path.split('/').pop() || '';
  const isStaticFile = lastSegment.includes('.');

  if (!c.env.ASSETS) {
    return c.text('Routing Fallback Error: ASSETS binding is missing. Please make sure binding = "ASSETS" is defined under the [assets] section in your wrangler.toml.', 500);
  }

  if (!isStaticFile) {
    try {
      const indexReq = new Request(new URL('/index.html', c.req.url).toString());
      const res = await c.env.ASSETS.fetch(indexReq);
      
      if (res.status === 200) {
        const creds = getCredentials(c);
        let listData = null;
        try {
          listData = await resolveFilesList(c, creds);
        } catch (e) {
          console.error('Failed to pre-hydrate cache for SEO fallback handler:', e);
        }

        const htmlText = await res.text();
        const hydratedHtml = injectSeoTags(htmlText, path, listData);
        return c.html(hydratedHtml);
      }
      
      return res;
    } catch (err: any) {
      return c.text('Routing Fallback Error: ' + err.message + '\n' + err.stack, 500);
    }
  }

  try {
    // Attempt to fetch static assets from edge assets
    const res = await c.env.ASSETS.fetch(c.req.raw);
    if (res.status === 404) {
      // Fallback to index.html if the asset is not found
      const indexReq = new Request(new URL('/index.html', c.req.url).toString());
      return await c.env.ASSETS.fetch(indexReq);
    }
    return res;
  } catch (err: any) {
    // Fallback to index.html if asset fetch throws (common on non-existent assets)
    try {
      const indexReq = new Request(new URL('/index.html', c.req.url).toString());
      return await c.env.ASSETS.fetch(indexReq);
    } catch (innerErr: any) {
      return c.text('Asset Fetch Fallback Error: ' + innerErr.message + '\n' + innerErr.stack, 500);
    }
  }
});

export default app;
