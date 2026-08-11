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
  appName: string,
  version: string
): Promise<DriveAppUploadResult> {
  const formData = new FormData();
  formData.append('apkFile', apkFile);
  if (iconFile) {
    formData.append('iconFile', iconFile);
  }
  if (appName) {
    formData.append('appName', appName);
  }
  if (version) {
    formData.append('version', version);
  }

  const response = await fetch('/api/drive/upload-app', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Server returned invalid app upload response');
  }

  return data;
}
