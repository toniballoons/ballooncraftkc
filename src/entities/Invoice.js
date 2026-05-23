import { createEntity } from '@/entities/_entityFactory';

const entity = createEntity('invoices');

export const list = entity.list;
export const filter = entity.filter;
export const get = entity.get;
export const create = entity.create;
export const update = entity.update;
export const remove = entity.remove;
