-- Migration: Add completed_at column to orders table
-- Records the timestamp when an order status changes to 'completed'

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Optional: Add index for querying completed orders by completion time
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at) WHERE completed_at IS NOT NULL;