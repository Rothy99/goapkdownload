export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  directDownloadUrl: string;
  webViewLink: string;
  createdTime?: string;
}

export interface DriveCredentials {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

/**
 * Requests a new access token from Google OAuth API using the refresh token
 */
export async function getAccessToken(credentials?: DriveCredentials): Promise<string> {
  const clientId = credentials?.clientId || process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = credentials?.clientSecret || process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
  const refreshToken = credentials?.refreshToken || process.env.REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || '';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive OAuth credentials missing (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)');
  }

  const url = 'https://oauth2.googleapis.com/token';
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch(url, {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to refresh access token: ${res.statusText} - ${errText}`);
  }

  const data: any = await res.json();
  return data.access_token;
}

/**
 * Performs a search or listing of files on Google Drive using fetch
 */
export async function listDriveFiles(token: string, query: string, fields = 'files(id, name, mimeType, parents, size, createdTime, webViewLink, webContentLink)'): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to list files from Google Drive: ${res.statusText} - ${errText}`);
  }

  return res.json();
}

/**
 * Gets a file metadata from Google Drive
 */
export async function getDriveFileMetadata(token: string, fileId: string, fields = 'id, name, mimeType, size, createdTime'): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${encodeURIComponent(fields)}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to get file metadata: ${res.statusText} - ${errText}`);
  }

  return res.json();
}

/**
 * Streams/downloads a file from Google Drive alt=media
 */
export async function fetchDriveFileStream(token: string, fileId: string): Promise<Response> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch file stream: ${res.statusText} - ${errText}`);
  }

  return res;
}

/**
 * Creates a folder in Google Drive
 */
export async function createDriveFolder(token: string, name: string, parentId?: string): Promise<string> {
  const url = 'https://www.googleapis.com/drive/v3/files';
  const metadata: any = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create folder: ${res.statusText} - ${errText}`);
  }

  const data: any = await res.json();
  return data.id;
}

/**
 * Gets or creates the main root folder for uploads
 */
export async function getOrCreateDriveFolder(token: string, folderName = 'GoAPKDownload_APKs'): Promise<string> {
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const data = await listDriveFiles(token, query, 'files(id, name)');

  if (data.files && data.files.length > 0 && data.files[0].id) {
    return data.files[0].id;
  }

  return createDriveFolder(token, folderName);
}

export async function uploadApkToDrive(
  fileBuffer: ArrayBuffer | Uint8Array,
  fileName: string,
  mimeType: string = 'application/vnd.android.package-archive',
  customFolderId?: string,
  credentials?: DriveCredentials
): Promise<DriveUploadResult> {
  const token = await getAccessToken(credentials);
  const folderId = customFolderId || (await getOrCreateDriveFolder(token));

  const metadata = {
    name: fileName,
    parents: [folderId],
    description: 'Uploaded package file hosted on Google Drive',
  };

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,createdTime';
  
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata);
  
  const encoder = new TextEncoder();
  const delimiterBytes = encoder.encode(delimiter);
  const metadataPartBytes = encoder.encode(metadataPart);
  const mediaHeaderBytes = encoder.encode(`\r\nContent-Type: ${mimeType}\r\n\r\n`);
  const closeDelimiterBytes = encoder.encode(closeDelimiter);
  
  const totalLength = delimiterBytes.length + metadataPartBytes.length + delimiterBytes.length + mediaHeaderBytes.length + fileBuffer.byteLength + closeDelimiterBytes.length;
  const bodyBytes = new Uint8Array(totalLength);
  
  let offset = 0;
  bodyBytes.set(delimiterBytes, offset); offset += delimiterBytes.length;
  bodyBytes.set(metadataPartBytes, offset); offset += metadataPartBytes.length;
  bodyBytes.set(delimiterBytes, offset); offset += delimiterBytes.length;
  bodyBytes.set(mediaHeaderBytes, offset); offset += mediaHeaderBytes.length;
  bodyBytes.set(new Uint8Array(fileBuffer), offset); offset += fileBuffer.byteLength;
  bodyBytes.set(closeDelimiterBytes, offset);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: bodyBytes,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload to Google Drive failed: ${res.statusText} - ${errText}`);
  }

  const driveFile: any = await res.json();
  const fileId = driveFile.id;
  if (!fileId) {
    throw new Error('Google Drive upload failed to return a file ID');
  }

  // Make file publicly accessible for direct fallback downloading
  try {
    const permUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
    await fetch(permUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Could not set public permissions on uploaded Google Drive file:', permErr);
  }

  const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const webViewLink = driveFile.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return {
    fileId,
    fileName: driveFile.name || fileName,
    fileSize: driveFile.size ? parseInt(driveFile.size, 10) : fileBuffer.byteLength,
    directDownloadUrl,
    webViewLink,
    createdTime: driveFile.createdTime || new Date().toISOString(),
  };
}
