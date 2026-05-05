-- Categories ---
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);
-- Staff (Barista / Admin) ---
CREATE TABLE IF NOT EXISTS staff (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('barista', 'admin')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  started_at DATE,
  birthdate DATE
);
-- Menu Items --- 
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE
);
-- Sizes (fixed 3 sizes — label and temperature only) ---
CREATE TABLE IF NOT EXISTS sizes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(20) NOT NULL,
  oz NUMERIC(5, 1) NOT NULL,
  temperature VARCHAR(10) NOT NULL CHECK (temperature IN ('hot', 'iced'))
);
-- Menu Item Sizes (price lives here — each item has its own price per size) ---
CREATE TABLE IF NOT EXISTS menu_item_sizes (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  size_id INTEGER REFERENCES sizes(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL
);
-- Ingredients (master list of all ingredients) ---
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  stock_qty NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  restock_threshold NUMERIC(10, 2) NOT NULL DEFAULT 10,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Recipes (which ingredients each menu item needs and how much) ---
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_needed NUMERIC(10, 2) NOT NULL
);
-- Add-ons ---
CREATE TABLE IF NOT EXISTS add_ons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);
-- Orders ---
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  daily_number INTEGER NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (daily_number, order_date)
);
-- Order Items --- 
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id),
  size_id INTEGER REFERENCES sizes(id),
  quantity INTEGER NOT NULL DEFAULT 1
);
-- Order Item Add-ons ---
CREATE TABLE IF NOT EXISTS order_item_addons (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
  add_on_id INTEGER REFERENCES add_ons(id)
);