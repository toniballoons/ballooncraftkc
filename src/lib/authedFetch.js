import { supabase } from '@/api/supabaseClient';

async function getAccessToken() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!session?.access_token) throw new Error('Please sign in again to continue.');
  return session.access_token;
}

export async function authedFetch(input, init = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers || {});

  headers.set('Authorization', `Bearer ${token}`);

  if (!(init.body instanceof FormData) && init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function authedJson(input, init = {}) {
  const response = await authedFetch(input, init);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload;
}
