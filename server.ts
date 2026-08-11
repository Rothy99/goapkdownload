import express from 'express';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getDriveAuthClient,
  getOrCreateDriveFolder,
  uploadApkToDrive,
} from './server/googleDriveService';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Configure multer for memory storage of uploaded APK files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 }, // 150MB limit
});

// ================= API ROUTES =================

/**
 * GET /api/drive/status
 * Check Google Drive OAuth status and connection details
 */
app.get('/api/drive/status', async (req, res) => {
  const drive = getDriveAuthClient();
  if (!drive) {
    return res.json({
      connected: false,
      message: 'Google Drive OAuth credentials missing (CLIENT_ID / REFRESH_TOKEN)',
    });
  }

  try {
    const about = await drive.about.get({
      fields: 'user, storageQuota',
    });

    return res.json({
      connected: true,
      user: about.data.user,
      storageQuota: about.data.storageQuota,
    });
  } catch (error: any) {
    console.error('Error connecting to Google Drive:', error);
    return res.json({
      connected: false,
      error: error.message || 'Failed to authenticate with Google Drive API',
    });
  }
});

/**
 * GET /api/drive/files
 * List all APK files uploaded to the GoAPKDownload Google Drive folder
 */
app.get('/api/drive/files', async (req, res) => {
  const drive = getDriveAuthClient();
  if (!drive) {
    return res.status(400).json({ error: 'Google Drive is not configured.' });
  }

  try {
    const folderId = await getOrCreateDriveFolder(drive);
    const filesList = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, size, createdTime)',
      orderBy: 'createdTime desc',
    });

    return res.json({
      success: true,
      files: filesList.data.files || [],
    });
  } catch (error: any) {
    console.error('Failed to list Google Drive files:', error);
    return res.status(500).json({ error: error.message || 'Error fetching files from Google Drive' });
  }
});

/**
 * POST /api/drive/upload
 * Upload an APK file to Google Drive and return public direct download link
 */
app.post('/api/drive/upload', upload.single('apkFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No APK file provided in request.' });
  }

  try {
    const fileName = req.file.originalname || `app_${Date.now()}.apk`;
    const result = await uploadApkToDrive(
      req.file.buffer,
      fileName,
      req.file.mimetype || 'application/vnd.android.package-archive'
    );

    return res.json({
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
    return res.status(500).json({ error: error.message || 'Failed to upload APK to Google Drive' });
  }
});

/**
 * GET /api/drive/download/:fileId
 * Proxy or direct redirect download URL for Google Drive file ID
 */
app.get('/api/drive/download/:fileId', async (req, res) => {
  const { fileId } = req.params;
  if (!fileId) {
    return res.status(400).json({ error: 'Missing file ID' });
  }

  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  return res.redirect(directUrl);
});

// ================= VITE DEV / PRODUCTION MIDDLEWARE =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GoAPKDownload Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
