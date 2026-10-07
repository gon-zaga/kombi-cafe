-- Migration: Add processed_by column to orders table
-- Run this against your Neon database to enable staff performance analytics

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS processed_by INTEGER REFERENCES staff(user_id);

-- Optional: Add index for better query performance on staff analytics
CREATE INDEX IF NOT EXISTS idx_orders_processed_by ON orders(processed_by);