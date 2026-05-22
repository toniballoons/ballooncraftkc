import { supabase } from '@/api/supabaseClient';

const TABLE = 'invoice_line_items';

export async function filter(conditions = {}, orderBy = 'sort_order') {
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

export async function createMany(items = []) {
  if (items.length === 0) return [];
  const { data, error } = await supabase.from(TABLE).insert(items).select('*');
  if (error) throw new Error(error.message);
  return data;
}

export async function replaceForInvoice(invoiceId, items = []) {
  const { error: deleteError } = await supabase.from(TABLE).delete().eq('invoice_id', invoiceId);
  if (deleteError) throw new Error(deleteError.message);

  if (items.length === 0) return [];

  const payload = items.map((item, index) => ({
    invoice_id: invoiceId,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    taxable: item.taxable !== false,
    sort_order: item.sort_order ?? index,
  }));

  return createMany(payload);
}
