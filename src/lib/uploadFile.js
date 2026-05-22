import { supabase } from '@/api/supabaseClient';

const BUCKET = 'site-assets';

function sanitizeSegment(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Uploads a File to Supabase Storage and returns its public URL.
 * @param {File} file
 * @param {{ folder?: string }} [options]
 * @returns {Promise<{ file_url: string, path: string, file_name: string, mime_type: string, size: number }>}
 */
export async function uploadFile(file, options = {}) {
  const safeName = sanitizeSegment(file?.name || 'upload');
  const safeFolder = sanitizeSegment(options.folder || '');
  const basePath = `${Date.now()}-${safeName}`;
  const path = safeFolder ? `${safeFolder}/${basePath}` : basePath;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    file_url: data.publicUrl,
    path,
    file_name: file?.name || safeName,
    mime_type: file?.type || '',
    size: Number(file?.size || 0),
  };
}
