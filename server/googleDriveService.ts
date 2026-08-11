import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  directDownloadUrl: string;
  webViewLink: string;
  createdTime?: string;
}

/**
 * Initializes and returns the Google Drive OAuth2 Client using client credentials
 */
export function getDriveAuthClient(): drive_v3.Drive | null {
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('Google Drive OAuth credentials missing (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)');
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth: oauth2Client });
  } catch (err) {
    console.error('Failed to create Google Drive OAuth2 client:', err);
    return null;
  }
}

/**
 * Helper to retrieve or create a specific folder in Google Drive
 */
export async function getOrCreateDriveFolder(
  drive: drive_v3.Drive,
  folderName: string = 'GoAPKDownload_APKs'
): Promise<string> {
  try {
    const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0 && res.data.files[0].id) {
      return res.data.files[0].id;
    }

    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    if (!folder.data.id) {
      throw new Error('Failed to retrieve new folder ID from Google Drive response');
    }

    return folder.data.id;
  } catch (err) {
    console.error(`Error in getOrCreateDriveFolder for "${folderName}":`, err);
    throw err;
  }
}

/**
 * Uploads an APK binary buffer to a specified Google Drive folder and sets public sharing permissions
 * Returns the file ID and direct sharing URLs.
 */
export async function uploadApkToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/vnd.android.package-archive',
  customFolderId?: string
): Promise<DriveUploadResult> {
  const drive = getDriveAuthClient();
  if (!drive) {
    throw new Error('Google Drive API client is not configured. Please check OAuth environment variables.');
  }

  const folderId = customFolderId || (await getOrCreateDriveFolder(drive));

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
    description: 'Uploaded Android Package file (APK) hosted on Google Drive',
  };

  const media = {
    mimeType,
    body: Readable.from(fileBuffer),
  };

  // 1. Upload APK file
  const driveFile = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink, size, createdTime',
  });

  const fileId = driveFile.data.id;
  if (!fileId) {
    throw new Error('Google Drive upload failed to return a file ID');
  }

  // 2. Make file publicly accessible for downloading
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (permErr) {
    console.warn('Could not set public permissions on uploaded Google Drive file:', permErr);
  }

  const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const webViewLink = driveFile.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return {
    fileId,
    fileName: driveFile.data.name || fileName,
    fileSize: driveFile.data.size ? parseInt(driveFile.data.size, 10) : fileBuffer.length,
    directDownloadUrl,
    webViewLink,
    createdTime: driveFile.data.createdTime || new Date().toISOString(),
  };
}
