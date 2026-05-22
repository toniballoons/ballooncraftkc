import { createSupabaseAdminClient } from '../server/server-utils.js';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64',
);

export default async function handler(req, res) {
  const token = req.query?.token;
  const supabase = createSupabaseAdminClient();

  if (token && supabase) {
    try {
      await supabase.rpc('mark_email_delivery_open', { target_token: token });
    } catch (error) {
      console.error('Failed to record email open:', error);
    }
  }

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate');
  return res.status(200).send(TRANSPARENT_GIF);
}
