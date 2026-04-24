import { supabase } from '@/api/supabaseClient';

const TABLE = 'site_content';

function parseOrderBy(orderBy = '-updated_at') {
  const descending = orderBy.startsWith('-');
  const column = descending ? orderBy.slice(1) : orderBy;
  return { column, ascending: !descending };
}

export async function list(orderBy = '-updated_at') {
  const { column, ascending } = parseOrderBy(orderBy);
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order(column, { ascending });
  if (error) throw new Error(error.message);
  return data;
}

export async function filter(conditions = {}) {
  let query = supabase.from(TABLE).select('*');
  for (const [key, value] of Object.entries(conditions)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function get(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function create(data) {
  const { data: created, error } = await supabase
    .from(TABLE)
    .insert(data)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return created;
}

export async function update(id, data) {
  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return updated;
}

export async function remove(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
