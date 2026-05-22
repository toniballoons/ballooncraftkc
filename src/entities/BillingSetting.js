import { supabase } from '@/api/supabaseClient';

const TABLE = 'billing_settings';

export async function getCurrent() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function saveCurrent(payload, existingId = null) {
  if (existingId) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', existingId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}
