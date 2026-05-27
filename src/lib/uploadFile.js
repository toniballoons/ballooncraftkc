import { authedFetch } from '@/lib/authedFetch';

function safeUploadName(file) {
  return String(file?.name || 'upload-file')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'upload-file';
}

/**
 * Uploads an admin-managed asset through the authenticated server upload endpoint
 * so storage RLS never blocks CMS changes from the browser.
 * @param {File} file
 * @returns {Promise<{ file_url: string, path?: string }>}
 */
export async function uploadFile(file) {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new Error('A valid file is required for upload.');
  }

  const response = await authedFetch('/api/admin?action=upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-Upload-Filename': safeUploadName(file),
    },
    body: file,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Upload failed.');
  }

  if (!payload.file_url) {
    throw new Error('Upload finished without a file URL.');
  }

  return payload;
}
