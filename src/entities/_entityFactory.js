import { supabase } from '@/api/supabaseClient';

function parseOrderBy(orderBy = '-updated_at') {
  const descending = orderBy.startsWith('-');
  const column = descending ? orderBy.slice(1) : orderBy;
  return { column, ascending: !descending };
}

export function createEntity(tableName) {
  return {
    async list(orderBy = '-updated_at') {
      const { column, ascending } = parseOrderBy(orderBy);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(column, { ascending });

      if (error) throw new Error(error.message);
      return data;
    },

    async filter(conditions = {}) {
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(conditions)) {
        query = query.eq(key, value);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },

    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    async remove(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
  };
}
