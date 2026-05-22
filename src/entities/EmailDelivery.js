import { supabase } from '@/api/supabaseClient';

const TABLE = 'email_deliveries';

export async function list(orderBy = '-sent_at') {
  const descending = orderBy.startsWith('-');
  const column = descending ? orderBy.slice(1) : orderBy;
  const { data, error } = await supabase.from(TABLE).select('*').order(column, { ascending: !descending });
  if (error) throw new Error(error.message);
  return data;
}

export async function filter(conditions = {}, orderBy = '-sent_at') {
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
