export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  directDownloadUrl: string;
  webViewLink: string;
  createdTime?: string;
}

export interface DriveAppUploadResult {
  success: boolean;
  appName: string;
  folderId: string;
  apk: {
    id: string;
    name: string;
    size: string;
    webViewLink: string;
    directDownloadUrl: string;
  };
  icon: {
    id: string;
    name: string;
    webViewLink: string;
  } | null;
  screenshots?: {
    id: string;
    name: string;
    webViewLink: string;
  }[];
}

/**
 * Client-side helper to upload an APK file through the app backend API endpoint
 */
export async function uploadApkFileViaApi(apkFile: File): Promise<DriveUploadResult> {
  const formData = new FormData();
  formData.append('apkFile', apkFile);

  const response = await fetch('/api/drive/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.file) {
    throw new Error(data.error || 'Server returned invalid upload response');
  }

  return {
    fileId: data.file.id,
    fileName: data.file.name,
    fileSize: data.file.size,
    directDownloadUrl: data.file.directDownloadUrl,
    webViewLink: data.file.webViewLink,
    createdTime: data.file.createdTime,
  };
}

/**
 * Client-side helper to upload both APK file and Icon image into a dedicated app folder in Google Drive
 */
export async function uploadAppComponentsViaApi(
  apkFile: File,
  iconFile: File | null,
  screenshotFiles: File[],
  appName: string,
  version: string,
  description: string,
  onProgress?: (percent: number, statusText?: string) => void
): Promise<DriveAppUploadResult> {
  // 1. Fetch access token and root folder ID from the backend
  const tokenRes = await fetch('/api/drive/token');
  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed to authenticate with upload token: ${tokenRes.status}`);
  }
  const { token, folderId: rootFolderId } = await tokenRes.json();

  // 2. Find or create the app subfolder directly from the client
  let subfolderId = '';
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name = '${appName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed = false`
  )}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!searchRes.ok) throw new Error('Failed to query app subfolder from Google Drive');
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    subfolderId = searchData.files[0].id;
    // Update existing folder description
    await fetch(`https://www.googleapis.com/drive/v3/files/${subfolderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: description
      })
    });
  } else {
    // Create the folder with description
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: appName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
        description: description
      })
    });
    if (!createRes.ok) throw new Error('Failed to create app folder in Google Drive');
    const newFolder = await createRes.json();
    subfolderId = newFolder.id;
  }

  // 3. Determine APK name
  let apkName = apkFile.name || `${appName.toLowerCase()}.apk`;
  if (version) {
    const cleanBase = appName.replace(/\s+/g, '');
    apkName = `${cleanBase}_${version}.apk`;
  }

  // 4. Upload APK file directly to Google Drive (with progress tracking)
  const apkBuffer = await apkFile.arrayBuffer();
  const apkUploadResult = await clientUploadFileDirect(
    token,
    new Uint8Array(apkBuffer),
    apkName,
    apkFile.type || 'application/vnd.android.package-archive',
    subfolderId,
    onProgress ? (pct) => onProgress(pct, `Uploading APK (${pct}%)...`) : undefined
  );

  // Set APK public sharing permissions
  await clientMakeFilePublic(token, apkUploadResult.id);

  // 5. Upload optional icon file directly to Google Drive
  let iconResult = null;
  if (iconFile) {
    if (onProgress) onProgress(100, 'Uploading App Icon...');
    const iconBuffer = await iconFile.arrayBuffer();
    
    // Force filename to start with 'icon' so the frontend detects it as the logo
    let iconName = 'icon.png';
    if (iconFile.name) {
      const ext = iconFile.name.split('.').pop();
      iconName = `icon.${ext || 'png'}`;
    }

    iconResult = await clientUploadFileDirect(
      token,
      new Uint8Array(iconBuffer),
      iconName,
      iconFile.type || 'image/png',
      subfolderId
    );
    await clientMakeFilePublic(token, iconResult.id);
  }

  // 6. Upload optional screenshot files directly to Google Drive
  const screenshotResults = [];
  if (screenshotFiles && screenshotFiles.length > 0) {
    for (let i = 0; i < screenshotFiles.length; i++) {
      const file = screenshotFiles[i];
      if (onProgress) {
        onProgress(100, `Uploading Screenshot ${i + 1}/${screenshotFiles.length}...`);
      }
      const buffer = await file.arrayBuffer();
      const uploadRes = await clientUploadFileDirect(
        token,
        new Uint8Array(buffer),
        file.name || `screenshot_${i + 1}.png`,
        file.type || 'image/png',
        subfolderId
      );
      await clientMakeFilePublic(token, uploadRes.id);
      screenshotResults.push({
        id: uploadRes.id,
        name: uploadRes.name || file.name,
        webViewLink: uploadRes.webViewLink || `https://drive.google.com/file/d/${uploadRes.id}/view`
      });
    }
  }

  return {
    success: true,
    appName,
    folderId: subfolderId,
    apk: {
      id: apkUploadResult.id,
      name: apkUploadResult.name || apkName,
      size: apkUploadResult.size || String(apkFile.size),
      webViewLink: apkUploadResult.webViewLink || `https://drive.google.com/file/d/${apkUploadResult.id}/view`,
      directDownloadUrl: `https://drive.google.com/uc?export=download&id=${apkUploadResult.id}`
    },
    icon: iconResult ? {
      id: iconResult.id,
      name: iconResult.name || iconFile.name,
      webViewLink: iconResult.webViewLink || `https://drive.google.com/file/d/${iconResult.id}/view`
    } : null,
    screenshots: screenshotResults
  };
}

// Client helper: upload a file directly to Google Drive upload API with progress support
function clientUploadFileDirect(
  token: string,
  fileBuffer: Uint8Array,
  fileName: string,
  mimeType: string,
  folderId: string,
  onProgress?: (percent: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const metadata = {
      name: fileName,
      parents: [folderId],
      description: 'Uploaded package file hosted on Google Drive'
    };

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,createdTime';
    
    const boundary = '-------314159265358979323846';
    
    const part1 = `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) + `\r\n`;
      
    const part2Header = `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`;
      
    const part2Footer = `\r\n--${boundary}--`;
    
    const encoder = new TextEncoder();
    const part1Bytes = encoder.encode(part1);
    const part2HeaderBytes = encoder.encode(part2Header);
    const part2FooterBytes = encoder.encode(part2Footer);
    
    const totalLength = part1Bytes.length + part2HeaderBytes.length + fileBuffer.byteLength + part2FooterBytes.length;
    const bodyBytes = new Uint8Array(totalLength);
    
    let offset = 0;
    bodyBytes.set(part1Bytes, offset); offset += part1Bytes.length;
    bodyBytes.set(part2HeaderBytes, offset); offset += part2HeaderBytes.length;
    bodyBytes.set(fileBuffer, offset); offset += fileBuffer.byteLength;
    bodyBytes.set(part2FooterBytes, offset);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(bodyBytes);
  });
}

// Client helper: make a file public on Google Drive
async function clientMakeFilePublic(token: string, fileId: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });
  if (!res.ok) {
    console.warn(`Could not set public permissions on Google Drive file ${fileId}`);
  }
}
