-- Migration: Add payment method to orders
-- The customer chooses how they intend to pay (counter cash or GCash).
-- For GCash the reference number is required at order time; the column is
-- nullable so existing rows (and the 'counter' option) have nothing stored.
-- Run this against your Neon database to enable payment-method ordering.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
  ADD COLUMN IF NOT EXISTS gcash_reference VARCHAR(50);

-- Fast lookup for filtering orders by how they were paid
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);