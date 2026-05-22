import { supabase } from '@/api/supabaseClient';

const TABLE = 'payments';

function parseOrderBy(orderBy = '-payment_date') {
  const descending = orderBy.startsWith('-');
  const column = descending ? orderBy.slice(1) : orderBy;
  return { column, ascending: !descending };
}

export async function list(orderBy = '-payment_date') {
  const { column, ascending } = parseOrderBy(orderBy);
  const { data, error } = await supabase.from(TABLE).select('*').order(column, { ascending });
  if (error) throw new Error(error.message);
  return data;
}

export async function filter(conditions = {}, orderBy = '-payment_date') {
  const { column, ascending } = parseOrderBy(orderBy);
  let query = supabase.from(TABLE).select('*');
  for (const [key, value] of Object.entries(conditions)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query.order(column, { ascending });
  if (error) throw new Error(error.message);
  return data;
}

export async function create(payload) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function update(id, payload) {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function remove(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
