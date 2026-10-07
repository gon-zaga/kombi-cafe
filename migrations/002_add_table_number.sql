-- Migration: Add table_number column to orders table
-- Run this against your Neon database to enable table-based ordering

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS table_number INTEGER;

-- Optional: Add index for better query performance on table analytics
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);