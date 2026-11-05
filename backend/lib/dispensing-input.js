import { z } from 'zod';

export const dispensingSchema = z.object({
  transaction_key: z.string().uuid(),
  prescription_id: z.string().uuid(),
  medicine_id: z.string().uuid(),
  inventory_batch_id: z.string().uuid(),
  quantity: z.number().int().positive().max(100000),
}).strict();
