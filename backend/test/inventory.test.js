import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryChangeSchema } from '../lib/inventory-input.js';
import { dispensingSchema } from '../lib/dispensing-input.js';

const medicineId = '00000000-0000-4000-8000-000000000001';
const batchId = '00000000-0000-4000-8000-000000000002';
const transactionKey = '00000000-0000-4000-8000-000000000003';

test('stock-in accepts a bounded batch transaction and applies safe defaults', () => {
  const parsed = inventoryChangeSchema.parse({
    action: 'stock_in', transaction_key: transactionKey, medicine_id: medicineId,
    batch_number: 'BATCH-1', expiry_date: '2030-01-01', quantity: 20,
  });
  assert.equal(parsed.reorder_level, 0);
});

test('stock-out requires a valid batch, positive quantity, and idempotency key', () => {
  assert.equal(inventoryChangeSchema.parse({
    action: 'stock_out', transaction_key: transactionKey,
    inventory_batch_id: batchId, quantity: 2,
  }).quantity, 2);
  assert.equal(inventoryChangeSchema.safeParse({
    action: 'stock_out', transaction_key: transactionKey,
    inventory_batch_id: batchId, quantity: 0,
  }).success, false);
});

test('inventory validation rejects unsupported actions and unexpected fields', () => {
  assert.equal(inventoryChangeSchema.safeParse({
    action: 'adjustment', transaction_key: transactionKey,
  }).success, false);
  assert.equal(inventoryChangeSchema.safeParse({
    action: 'stock_out', transaction_key: transactionKey,
    inventory_batch_id: batchId, quantity: 1, patient_id: medicineId,
  }).success, false);
});

test('dispensing input requires an idempotency key and positive integer quantity', () => {
  const input = {
    transaction_key: transactionKey,
    prescription_id: medicineId,
    medicine_id: batchId,
    inventory_batch_id: '00000000-0000-4000-8000-000000000004',
    quantity: 1,
  };
  assert.equal(dispensingSchema.parse(input).quantity, 1);
  assert.equal(dispensingSchema.safeParse({ ...input, quantity: 0 }).success, false);
  assert.equal(dispensingSchema.safeParse({ ...input, duplicate: true }).success, false);
});
