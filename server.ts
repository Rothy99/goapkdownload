import { Hono } from 'hono';
import { serve, type HttpBindings } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { createServer as createViteServer } from 'vite';
import {
  getDriveAuthClient,
  getOrCreateDriveFolder,
  uploadApkToDrive,
} from './server/googleDriveService';

dotenv.config();

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
  const drive = getDriveAuthClient();
  if (!drive) {
    return c.json({
      connected: false,
      message: 'Google Drive OAuth credentials missing (CLIENT_ID / REFRESH_TOKEN)',
    });
  }

  try {
    const about = await drive.about.get({
      fields: 'user, storageQuota',
    });

    return c.json({
      connected: true,
      user: about.data.user,
      storageQuota: about.data.storageQuota,
    });
  } catch (error: any) {
    console.error('Error connecting to Google Drive:', error);
    return c.json({
      connected: false,
      error: error.message || 'Failed to authenticate with Google Drive API',
    });
  }
});

// Simple in-memory cache to avoid repeated slow Google Drive API calls
let cachedFolderId: string | null = null;
let cachedFilesResponse: any = null;
let cacheExpiry = 0;
const CACHE_DURATION_MS = 15000; // Cache lists for 15 seconds

/**
 * GET /api/drive/files
 * List all APK files uploaded to the GoAPKDownload Google Drive folder
 */
api.get('/drive/files', async (c) => {
  const drive = getDriveAuthClient();
  if (!drive) {
    return c.json({ error: 'Google Drive is not configured.' }, 400);
  }

  const now = Date.now();
  if (cachedFilesResponse && now < cacheExpiry) {
    return c.json(cachedFilesResponse);
  }

  try {
    let folderId = cachedFolderId;
    if (!folderId) {
      folderId = await getOrCreateDriveFolder(drive);
      cachedFolderId = folderId;
    }
    
    // 1. List items directly in the main folder to find subfolders
    const initialList = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, size, createdTime)',
    });

    const items = initialList.data.files || [];
    const subfolders = items.filter(i => i.mimeType === 'application/vnd.google-apps.folder');

    // 2. Fetch files from root folder and all subfolders
    const parentIds = [folderId, ...subfolders.map(sf => sf.id)];
    const parentQuery = parentIds.map(id => `'${id}' in parents`).join(' or ');

    const filesList = await drive.files.list({
      q: `(${parentQuery}) and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, size, createdTime, parents)',
      orderBy: 'createdTime desc',
    });

    const responseData = {
      success: true,
      rootFolderId: folderId,
      files: filesList.data.files || [],
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
    const buffer = Buffer.from(arrayBuffer);

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
  const drive = getDriveAuthClient();
  if (!drive) {
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

    // 1. Get root folder ID
    const rootFolderId = await getOrCreateDriveFolder(drive);

    // 2. Create the app subfolder in Google Drive under root folder
    // Check if the subfolder already exists to avoid duplicates
    let subfolderId = '';
    const folderQuery = `name = '${appName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed = false`;
    const searchFolder = await drive.files.list({
      q: folderQuery,
      fields: 'files(id)',
    });

    if (searchFolder.data.files && searchFolder.data.files.length > 0 && searchFolder.data.files[0].id) {
      subfolderId = searchFolder.data.files[0].id;
    } else {
      const newFolder = await drive.files.create({
        requestBody: {
          name: appName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootFolderId],
        },
        fields: 'id',
      });
      subfolderId = newFolder.data.id || '';
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
    const apkBuffer = Buffer.from(await apkFile.arrayBuffer());
    const apkResult = await uploadApkToDrive(
      apkBuffer,
      apkName,
      apkFile.type || 'application/vnd.android.package-archive',
      subfolderId
    );

    // 4. Upload optional icon file to the same subfolder
    let iconResult = null;
    if (iconFile && iconFile instanceof File) {
      const iconBuffer = Buffer.from(await iconFile.arrayBuffer());
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

  const drive = getDriveAuthClient();
  if (!drive) {
    return c.json({ error: 'Google Drive is not configured.' }, 400);
  }

  try {
    // 1. Get the file metadata to find the MIME type and name
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType',
    });

    // 2. Fetch the file content/stream
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      {
        responseType: 'stream',
      }
    );

    const contentType = metadata.data.mimeType || 'application/octet-stream';
    const fileName = metadata.data.name || 'file';

    c.header('Content-Type', contentType);
    c.header('Content-Disposition', `inline; filename="${fileName}"`);
    c.header('Cache-Control', 'public, max-age=31536000, immutable');

    // Stream the response directly to the client
    const webStream = Readable.toWeb(response.data as Readable) as ReadableStream;
    return c.body(webStream);
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

  const drive = getDriveAuthClient();
  if (!drive) {
    return c.json({ error: 'Google Drive is not configured.' }, 400);
  }

  try {
    // 1. Get the file metadata to find the MIME type and name
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType',
    });

    // 2. Fetch the file content/stream using media mode
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      {
        responseType: 'stream',
      }
    );

    const contentType = metadata.data.mimeType || 'application/vnd.android.package-archive';
    const fileName = metadata.data.name || 'app.apk';

    c.header('Content-Type', contentType);
    c.header('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the response directly to the client
    const webStream = Readable.toWeb(response.data as Readable) as ReadableStream;
    return c.body(webStream);
  } catch (error: any) {
    console.error('Error downloading file from Google Drive:', error);
    return c.json({ error: error.message || 'Failed to download file from Google Drive' }, 500);
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

    // Fallback GET to serve index.html for React SPA router
    app.get('*', async (c) => {
      try {
        const indexPath = path.join(process.cwd(), 'dist', 'index.html');
        const html = await fs.promises.readFile(indexPath, 'utf-8');
        return c.html(html);
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
