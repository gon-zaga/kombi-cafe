-- Add order_type column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeout'));

-- Add index for filtering by order_type
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders (order_type);