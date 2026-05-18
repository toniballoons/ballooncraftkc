import { supabase } from '@/api/supabaseClient';

const BUCKET = 'site-assets';

/**
 * Uploads a File to Supabase Storage and returns its public URL.
 * @param {File} file
 * @returns {Promise<{ file_url: string }>}
 */
export async function uploadFile(file) {
  const path = `${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { file_url: data.publicUrl };
}
