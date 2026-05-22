import { supabase } from '@/api/supabaseClient';

const TABLE = 'contract_events';

export async function filter(conditions = {}, orderBy = '-occurred_at') {
  const descending = orderBy.startsWith('-');
  const column = descending ? orderBy.slice(1) : orderBy;

  let query = supabase.from(TABLE).select('*');
  for (const [key, value] of Object.entries(conditions)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query.order(column, { ascending: !descending });
  if (error) throw new Error(error.message);
  return data;
}
