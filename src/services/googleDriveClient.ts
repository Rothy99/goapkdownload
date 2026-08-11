export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  directDownloadUrl: string;
  webViewLink: string;
  createdTime?: string;
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
