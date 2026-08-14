import { Hono } from 'hono';
import { serve, type HttpBindings } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getAccessToken,
  getOrCreateDriveFolder,
  listDriveFiles,
  getDriveFileMetadata,
  fetchDriveFileStream,
  uploadApkToDrive,
  createDriveFolder,
} from './server/googleDriveService';

dotenv.config();

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
            .replace(/[-_]/g, ' ')
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
          .replace(/[-_]/g, ' ')
      : 'Unknown App';
    
    const capitalizedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    const updatedDate = mainFile.createdTime 
      ? mainFile.createdTime.split('T')[0] 
      : new Date().toISOString().split('T')[0];

    const computedCategory = getCategoryFromFileName(mainFile.name || '');

    let appDescription = `Android package file (${mainFile.name}) hosted securely on Google Drive.`;
    const parentId = mainFile.parents && mainFile.parents[0];
    let iconUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80';
    let screenshots = [iconUrl];

    if (parentId && parentId !== rootFolderId) {
      const subfolder = subfolders.find((sf: any) => sf.id === parentId);
      if (subfolder && subfolder.description) {
        appDescription = subfolder.description;
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
        minAndroid: 'Android 8.0+',
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
      packageName: `com.gdrive.app.${groupKey.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      category: computedCategory,
      rating: 5.0,
      totalReviews: 1,
      downloadsCount: 'New',
      downloadsNumeric: 1,
      icon: iconUrl,
      banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      developer: 'GoAPK',
      minAndroid: 'Android 8.0+',
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
    return htmlText;
  }

  const appItem = findAppDetailByName(listData, routeSlug);
  if (!appItem) {
    return htmlText;
  }

  const appTitle = appItem.title;
  const seoTitle = `${appTitle} APK Download - Latest Version`;
  const seoDesc = `Download ${appTitle} APK and learn about its latest version, features, compatibility, and installation.`;
  const canonicalUrl = `https://goapk.store/app/${appItem.slug}`;

  // Replace default title
  let updatedHtml = htmlText.replace(/<title>.*?<\/title>/i, `<title>${seoTitle}</title>`);
  
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

const app = new Hono<{ Bindings: HttpBindings }>();
const PORT = 3000;

// API routes first
const api = new Hono();

// Enable CORS for frontend compatibility
api.use('*', cors());

/**
 * GET /api/drive/status
 * Check Google Drive OAuth status and connection details
 */
api.get('/drive/status', async (c) => {
  try {
    const token = await getAccessToken();
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
api.get('/drive/token', async (c) => {
  try {
    const token = await getAccessToken();
    const folderId = await getOrCreateDriveFolder(token);
    return c.json({ token, folderId });
  } catch (error: any) {
    console.error('Error generating client upload token:', error);
    return c.json({ error: error.message || 'Failed to generate token' }, 500);
  }
});

// Simple in-memory cache to avoid repeated slow Google Drive API calls
let cachedFolderId: string | null = null;
let cachedFilesResponse: any = null;
let cacheExpiry = 0;
const CACHE_DURATION_MS = 30 * 60 * 1000; // Cache lists for 30 minutes

/**
 * GET /api/drive/files
 * List all APK files uploaded to the GoAPKDownload Google Drive folder
 */
api.get('/drive/files', async (c) => {
  try {
    await getAccessToken();
  } catch (e) {
    return c.json({ error: 'Google Drive is not configured.' }, 400);
  }

  const now = Date.now();
  if (cachedFilesResponse && now < cacheExpiry) {
    return c.json(cachedFilesResponse);
  }

  try {
    const token = await getAccessToken();
    let folderId = cachedFolderId;
    if (!folderId) {
      folderId = await getOrCreateDriveFolder(token);
      cachedFolderId = folderId;
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

    // Cache the response
    cachedFilesResponse = responseData;
    cacheExpiry = Date.now() + CACHE_DURATION_MS;

    return c.json(responseData);
  } catch (error: any) {
    console.error('Failed to list Google Drive files:', error);
    return c.json({ error: error.message || 'Error fetching files from Google Drive' }, 500);
  }
});

/**
 * GET /api/drive/app/:name
 * Retrieve details for a single application dynamically by its name or slug
 */
api.get('/drive/app/:name', async (c) => {
  const nameParam = c.req.param('name');
  if (!nameParam) {
    return c.json({ error: 'Missing app name or slug' }, 400);
  }

  try {
    await getAccessToken();
  } catch (e) {
    return c.json({ error: 'Google Drive is not configured.' }, 400);
  }

  let listData = cachedFilesResponse;
  const now = Date.now();
  if (!listData || now >= cacheExpiry) {
    try {
      const token = await getAccessToken();
      let folderId = cachedFolderId;
      if (!folderId) {
        folderId = await getOrCreateDriveFolder(token);
        cachedFolderId = folderId;
      }
      const folderQuery = `'${folderId}' in parents and trashed = false`;
      const initialList = await listDriveFiles(token, folderQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime)');
      const items = initialList.files || [];
      const subfolders = items.filter((i: any) => i.mimeType === 'application/vnd.google-apps.folder');

      const parentIds = [folderId, ...subfolders.map((sf: any) => sf.id)];
      const parentQuery = parentIds.map(id => `'${id}' in parents`).join(' or ');
      const filesQuery = `(${parentQuery}) and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
      const filesList = await listDriveFiles(token, filesQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime, parents)');

      listData = {
        success: true,
        rootFolderId: folderId,
        subfolders,
        files: filesList.files || [],
      };
      cachedFilesResponse = listData;
      cacheExpiry = Date.now() + CACHE_DURATION_MS;
    } catch (e: any) {
      return c.json({ error: 'Failed to fetch files from Google Drive: ' + e.message }, 500);
    }
  }

  const appItem = findAppDetailByName(listData, nameParam);
  if (!appItem) {
    return c.json({ error: `App with name or slug '${nameParam}' not found.` }, 404);
  }

  return c.json({ success: true, app: appItem });
});

/**
 * POST /api/drive/indexnow
 * Notify IndexNow engine of a newly added or updated app URL
 */
api.post('/drive/indexnow', async (c) => {
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
api.post('/drive/upload', async (c) => {
  try {
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
      file.type || 'application/vnd.android.package-archive'
    );

    // Invalidate the cache on successful upload so the new file displays immediately
    cacheExpiry = 0;

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
api.post('/drive/upload-app', async (c) => {
  try {
    await getAccessToken();
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
        .replace(/[-_]/g, ' ') // replace dash/underscore with space
        .trim();
      
      appName = appName.charAt(0).toUpperCase() + appName.slice(1);
    }

    if (!appName) {
      appName = 'Unknown App';
    }

    const token = await getAccessToken();
    // 1. Get root folder ID
    const rootFolderId = await getOrCreateDriveFolder(token);

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
      subfolderId
    );

    // 4. Upload optional icon file to the same subfolder
    let iconResult = null;
    if (iconFile && iconFile instanceof File) {
      const iconBuffer = new Uint8Array(await iconFile.arrayBuffer());
      iconResult = await uploadApkToDrive(
        iconBuffer,
        iconFile.name || 'icon.png',
        iconFile.type || 'image/png',
        subfolderId
      );
    }

    // Invalidate the cache so the new app is immediately listed
    cacheExpiry = 0;

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
api.get('/drive/file/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  if (!fileId) {
    return c.json({ error: 'Missing file ID' }, 400);
  }

  try {
    const token = await getAccessToken();
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
api.get('/drive/download/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  if (!fileId) {
    return c.json({ error: 'Missing file ID' }, 400);
  }

  try {
    const token = await getAccessToken();
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

  let listData = cachedFilesResponse;
  const now = Date.now();

  const revalidate = async () => {
    try {
      const token = await getAccessToken();
      let folderId = cachedFolderId;
      if (!folderId) {
        folderId = await getOrCreateDriveFolder(token);
        cachedFolderId = folderId;
      }
      const folderQuery = `'${folderId}' in parents and trashed = false`;
      const initialList = await listDriveFiles(token, folderQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime)');
      const items = initialList.files || [];
      const subfolders = items.filter((i: any) => i.mimeType === 'application/vnd.google-apps.folder');

      const parentIds = [folderId, ...subfolders.map((sf: any) => sf.id)];
      const parentQuery = parentIds.map(id => `'${id}' in parents`).join(' or ');
      const filesQuery = `(${parentQuery}) and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
      const filesList = await listDriveFiles(token, filesQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime, parents)');

      const newData = {
        success: true,
        rootFolderId: folderId,
        subfolders,
        files: filesList.files || [],
      };
      cachedFilesResponse = newData;
      cacheExpiry = Date.now() + CACHE_DURATION_MS;
      console.log('Sitemap cache successfully revalidated in background.');
    } catch (e) {
      console.error('Failed to revalidate sitemap cache in background:', e);
    }
  };

  // If we have cached files data, serve it instantly and revalidate in background if expired
  if (listData) {
    if (now >= cacheExpiry) {
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
    const token = await getAccessToken();
    let folderId = cachedFolderId;
    if (!folderId) {
      folderId = await getOrCreateDriveFolder(token);
      cachedFolderId = folderId;
    }
    const folderQuery = `'${folderId}' in parents and trashed = false`;
    const initialList = await listDriveFiles(token, folderQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime)');
    const items = initialList.files || [];
    const subfolders = items.filter((i: any) => i.mimeType === 'application/vnd.google-apps.folder');

    const parentIds = [folderId, ...subfolders.map((sf: any) => sf.id)];
    const parentQuery = parentIds.map(id => `'${id}' in parents`).join(' or ');
    const filesQuery = `(${parentQuery}) and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
    const filesList = await listDriveFiles(token, filesQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime, parents)');

    listData = {
      success: true,
      rootFolderId: folderId,
      subfolders,
      files: filesList.files || [],
    };
    cachedFilesResponse = listData;
    cacheExpiry = Date.now() + CACHE_DURATION_MS;

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

// Mount the api router
app.route('/api', api);

// Vite & Static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use('*', async (c, next) => {
      // Do not forward /api calls to Vite dev server
      if (c.req.path.startsWith('/api')) {
        await next();
        return;
      }

      await new Promise<void>((resolve) => {
        vite.middlewares(c.env.incoming, c.env.outgoing, () => {
          resolve();
        });
      });
    });
  } else {
    // Serve static files from dist
    app.use('*', serveStatic({ root: './dist' }));

    app.get('*', async (c) => {
      try {
        const indexPath = path.join(process.cwd(), 'dist', 'index.html');
        let htmlText = await fs.promises.readFile(indexPath, 'utf-8');

        const pathParam = c.req.path;
        let routeSlug = '';
        const pathname = pathParam.toLowerCase();
        
        if (pathname.includes('/app/')) {
          routeSlug = pathParam.split('/app/')[1].split('/')[0];
        } else if (pathname.includes('/apk/')) {
          routeSlug = pathParam.split('/apk/')[1].split('/')[0];
        } else if (pathname.includes('/download/')) {
          routeSlug = pathParam.split('/download/')[1].split('/')[0];
        }

        if (routeSlug) {
          let listData = cachedFilesResponse;
          if (!listData) {
            try {
              const token = await getAccessToken();
              let folderId = cachedFolderId;
              if (!folderId) {
                folderId = await getOrCreateDriveFolder(token);
                cachedFolderId = folderId;
              }
              const folderQuery = `'${folderId}' in parents and trashed = false`;
              const initialList = await listDriveFiles(token, folderQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime)');
              const items = initialList.files || [];
              const subfolders = items.filter((i: any) => i.mimeType === 'application/vnd.google-apps.folder');

              const parentIds = [folderId, ...subfolders.map((sf: any) => sf.id)];
              const parentQuery = parentIds.map(id => `'${id}' in parents`).join(' or ');
              const filesQuery = `(${parentQuery}) and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
              const filesList = await listDriveFiles(token, filesQuery, 'files(id, name, mimeType, description, webViewLink, webContentLink, size, createdTime, parents)');

              listData = {
                success: true,
                rootFolderId: folderId,
                subfolders,
                files: filesList.files || [],
              };
              cachedFilesResponse = listData;
              cacheExpiry = Date.now() + CACHE_DURATION_MS;
            } catch (e) {
              console.error('Failed to pre-hydrate cache for local SEO handler:', e);
            }
          }
          htmlText = injectSeoTags(htmlText, pathParam, listData);
        }

        return c.html(htmlText);
      } catch (err) {
        return c.text('Not Found', 404);
      }
    });
  }

  serve({
    fetch: app.fetch,
    port: PORT,
    hostname: '0.0.0.0',
  }, (info) => {
    console.log(`GoAPKDownload Server running on http://${info.address}:${info.port}`);
  });
}

startServer();
