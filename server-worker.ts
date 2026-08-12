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

const app = new Hono();

// Enable CORS for frontend compatibility
app.use('*', cors());

/**
 * GET /api/drive/status
 * Check Google Drive OAuth status and connection details
 */
app.get('/api/drive/status', async (c) => {
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

// Simple in-memory cache to avoid repeated slow Google Drive API calls
let cachedFolderId: string | null = null;
let cachedFilesResponse: any = null;
let cacheExpiry = 0;
const CACHE_DURATION_MS = 15000; // Cache lists for 15 seconds

/**
 * GET /api/drive/files
 * List all APK files uploaded to the GoAPKDownload Google Drive folder
 */
app.get('/api/drive/files', async (c) => {
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
    const initialList = await listDriveFiles(token, folderQuery, 'files(id, name, mimeType, webViewLink, webContentLink, size, createdTime)');
    
    const items = initialList.files || [];
    const subfolders = items.filter((i: any) => i.mimeType === 'application/vnd.google-apps.folder');

    // 2. Fetch files from root folder and all subfolders
    const parentIds = [folderId, ...subfolders.map((sf: any) => sf.id)];
    const parentQuery = parentIds.map(id => `'${id}' in parents`).join(' or ');
    const filesQuery = `(${parentQuery}) and trashed = false`;

    const filesList = await listDriveFiles(token, filesQuery, 'files(id, name, mimeType, webViewLink, webContentLink, size, createdTime, parents)');

    const responseData = {
      success: true,
      rootFolderId: folderId,
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
 * POST /api/drive/upload
 * Upload an APK file to Google Drive and return public direct download link
 */
app.post('/api/drive/upload', async (c) => {
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
app.post('/api/drive/upload-app', async (c) => {
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
app.get('/api/drive/file/:fileId', async (c) => {
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

    c.header('Content-Type', contentType);
    c.header('Content-Disposition', `inline; filename="${fileName}"`);
    c.header('Cache-Control', 'public, max-age=31536000, immutable');

    // Stream the response body (ReadableStream) directly
    return c.body(response.body);
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
    const token = await getAccessToken();
    const metadata = await getDriveFileMetadata(token, fileId, 'name, mimeType');
    const response = await fetchDriveFileStream(token, fileId);

    const contentType = metadata.mimeType || 'application/vnd.android.package-archive';
    const fileName = metadata.name || 'app.apk';

    c.header('Content-Type', contentType);
    c.header('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the response body (ReadableStream) directly
    return c.body(response.body);
  } catch (error: any) {
    console.error('Error downloading file from Google Drive:', error);
    return c.json({ error: error.message || 'Failed to download file from Google Drive' }, 500);
  }
});

export default app;
