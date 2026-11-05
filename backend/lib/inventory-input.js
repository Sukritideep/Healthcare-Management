import { z } from 'zod';

export const inventoryChangeSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('stock_in'),
    transaction_key: z.string().uuid(),
    medicine_id: z.string().uuid(),
    batch_number: z.string().trim().min(1).max(100),
    expiry_date: z.iso.date(),
    quantity: z.number().int().positive().max(1_000_000),
    reorder_level: z.number().int().nonnegative().max(1_000_000).default(0),
    supplier_name: z.string().trim().max(200).optional(),
    note: z.string().trim().max(500).optional(),
  }).strict(),
  z.object({
    action: z.literal('stock_out'),
    transaction_key: z.string().uuid(),
    inventory_batch_id: z.string().uuid(),
    quantity: z.number().int().positive().max(1_000_000),
    note: z.string().trim().max(500).optional(),
  }).strict(),
]);
