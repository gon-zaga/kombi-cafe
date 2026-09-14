-- ============================================================
-- SEED DATA (v2 - category-safe matching)
-- Run this AFTER schema.sql has been applied.
-- Fixes: some item names repeat across categories
-- (Hazelnut Mocha, Salted Caramel, Mixed Berries), so every
-- row here includes its category name to avoid ambiguous matches.
-- ============================================================
-- ==================== CATEGORIES ====================
INSERT INTO categories (name)
VALUES ('Kaffee'),
  ('Klassik Kaffee'),
  ('Specialty Kaffee'),
  ('Kaffee Frappe'),
  ('Non-Kaffee Latte'),
  ('Fruitee Latte'),
  ('The Beetles Juice'),
  ('Non-Kaffee Frappe'),
  ('Snacks') ON CONFLICT (name) DO NOTHING;
-- ==================== SIZES ====================
INSERT INTO sizes (label, oz, temperature)
VALUES ('Kafer', 12, 'hot'),
  ('Hippie', 16, 'iced'),
  ('Bulli', 22, 'iced'),
  ('Regular', NULL, NULL);
-- ==================== ADD-ONS ====================
INSERT INTO add_ons (name, price)
VALUES ('Espresso[1 shot]', 10),
  ('Whip Cream/Milk', 25),
  ('Java Chips', 20),
  ('Crushed Oreo', 10),
  ('Tea Flavor[O/WM]', 10),
  ('Nata de Coco', 20),
  ('Irish Coffee[20ml]', 20),
  ('Cookie Cup', 100);
-- ==================== MENU ITEMS ====================
-- One row per product. Category is looked up by name.
INSERT INTO menu_items (name, category_id, image_url)
SELECT seed.item_name,
  categories.id,
  '/drinks/no-drink-image.svg'
FROM (
    VALUES ('Kombi Americano', 'Kaffee'),
      ('Kombi Latte', 'Kaffee'),
      ('Kombi Flat White', 'Kaffee'),
      ('Kombi Cappuccino', 'Kaffee'),
      ('Kombi Macchiato', 'Kaffee'),
      ('Spanish Latte', 'Klassik Kaffee'),
      ('Vanilla Latte', 'Klassik Kaffee'),
      ('Hazelnut Latte', 'Klassik Kaffee'),
      ('Caramel Latte', 'Klassik Kaffee'),
      ('Salted Caramel', 'Specialty Kaffee'),
      ('Hazelnut Mocha', 'Specialty Kaffee'),
      ('Pistachio Latte', 'Specialty Kaffee'),
      ('Roasted Almond', 'Specialty Kaffee'),
      ('Dark Mocha (Java Chips)', 'Kaffee Frappe'),
      ('Hazelnut', 'Kaffee Frappe'),
      ('Hazelnut Mocha', 'Kaffee Frappe'),
      ('Salted Caramel', 'Kaffee Frappe'),
      ('Oreo Coffee', 'Kaffee Frappe'),
      ('Dirty Matcha', 'Kaffee Frappe'),
      ('Kombiccino', 'Kaffee Frappe'),
      ('Black Tea', 'Non-Kaffee Latte'),
      ('Black Tea Latte', 'Non-Kaffee Latte'),
      ('Matcha Latte', 'Non-Kaffee Latte'),
      ('Babyccino', 'Non-Kaffee Latte'),
      ('Dark Babyccino', 'Non-Kaffee Latte'),
      ('Strawberry Latte', 'Fruitee Latte'),
      ('Blueberry Latte', 'Fruitee Latte'),
      ('Mango Latte', 'Fruitee Latte'),
      ('Mixed Berries', 'Fruitee Latte'),
      ('John Lemon Ginger', 'The Beetles Juice'),
      ('Paul Strawberry', 'The Beetles Juice'),
      ('Ringo Mango', 'The Beetles Juice'),
      ('George Blueberry', 'The Beetles Juice'),
      ('Strawberry', 'Non-Kaffee Frappe'),
      ('Blueberry', 'Non-Kaffee Frappe'),
      ('Mango', 'Non-Kaffee Frappe'),
      ('Mixed Berries', 'Non-Kaffee Frappe'),
      ('Oreo', 'Non-Kaffee Frappe'),
      ('Matcha', 'Non-Kaffee Frappe'),
      ('Java Chips', 'Non-Kaffee Frappe'),
      ('Pizza 2Pi Burger', 'Snacks'),
      ('Pizza Pi Burger', 'Snacks'),
      ('Double Grilled Cheese', 'Snacks'),
      ('Cheese Burger', 'Snacks'),
      ('Regular Burger', 'Snacks'),
      ('Hotdog Sandwich', 'Snacks'),
      ('Cheese Sticks', 'Snacks'),
      ('French Fries', 'Snacks')
  ) AS seed(item_name, category_name)
  JOIN categories ON categories.name = seed.category_name;
-- ==================== MENU ITEM SIZES ====================
-- Matches on item name + category name together, so duplicate
-- item names across categories (Hazelnut Mocha, Salted Caramel,
-- Mixed Berries) resolve to the correct menu_items row.
INSERT INTO menu_item_sizes (menu_item_id, size_id, price)
SELECT menu_items.id,
  sizes.id,
  seed.price
FROM (
    VALUES ('Kombi Americano', 'Kaffee', 'Kafer', 90),
      ('Kombi Americano', 'Kaffee', 'Hippie', 80),
      ('Kombi Americano', 'Kaffee', 'Bulli', 90),
      ('Kombi Latte', 'Kaffee', 'Kafer', 110),
      ('Kombi Latte', 'Kaffee', 'Hippie', 100),
      ('Kombi Latte', 'Kaffee', 'Bulli', 110),
      ('Kombi Flat White', 'Kaffee', 'Kafer', 120),
      ('Kombi Flat White', 'Kaffee', 'Hippie', 100),
      ('Kombi Flat White', 'Kaffee', 'Bulli', 120),
      ('Kombi Cappuccino', 'Kaffee', 'Kafer', 130),
      ('Kombi Cappuccino', 'Kaffee', 'Hippie', 120),
      ('Kombi Cappuccino', 'Kaffee', 'Bulli', 130),
      ('Kombi Macchiato', 'Kaffee', 'Kafer', 130),
      ('Kombi Macchiato', 'Kaffee', 'Hippie', 130),
      ('Kombi Macchiato', 'Kaffee', 'Bulli', 140),
      ('Spanish Latte', 'Klassik Kaffee', 'Kafer', 120),
      ('Spanish Latte', 'Klassik Kaffee', 'Hippie', 110),
      ('Spanish Latte', 'Klassik Kaffee', 'Bulli', 120),
      ('Vanilla Latte', 'Klassik Kaffee', 'Kafer', 120),
      ('Vanilla Latte', 'Klassik Kaffee', 'Hippie', 110),
      ('Vanilla Latte', 'Klassik Kaffee', 'Bulli', 120),
      ('Hazelnut Latte', 'Klassik Kaffee', 'Kafer', 120),
      (
        'Hazelnut Latte',
        'Klassik Kaffee',
        'Hippie',
        110
      ),
      ('Hazelnut Latte', 'Klassik Kaffee', 'Bulli', 120),
      ('Caramel Latte', 'Klassik Kaffee', 'Kafer', 120),
      ('Caramel Latte', 'Klassik Kaffee', 'Hippie', 110),
      ('Caramel Latte', 'Klassik Kaffee', 'Bulli', 120),
      (
        'Salted Caramel',
        'Specialty Kaffee',
        'Kafer',
        120
      ),
      (
        'Salted Caramel',
        'Specialty Kaffee',
        'Hippie',
        110
      ),
      (
        'Salted Caramel',
        'Specialty Kaffee',
        'Bulli',
        120
      ),
      (
        'Hazelnut Mocha',
        'Specialty Kaffee',
        'Kafer',
        120
      ),
      (
        'Hazelnut Mocha',
        'Specialty Kaffee',
        'Hippie',
        110
      ),
      (
        'Hazelnut Mocha',
        'Specialty Kaffee',
        'Bulli',
        120
      ),
      (
        'Pistachio Latte',
        'Specialty Kaffee',
        'Kafer',
        120
      ),
      (
        'Pistachio Latte',
        'Specialty Kaffee',
        'Hippie',
        110
      ),
      (
        'Pistachio Latte',
        'Specialty Kaffee',
        'Bulli',
        120
      ),
      (
        'Roasted Almond',
        'Specialty Kaffee',
        'Kafer',
        120
      ),
      (
        'Roasted Almond',
        'Specialty Kaffee',
        'Hippie',
        110
      ),
      (
        'Roasted Almond',
        'Specialty Kaffee',
        'Bulli',
        120
      ),
      (
        'Dark Mocha (Java Chips)',
        'Kaffee Frappe',
        'Bulli',
        160
      ),
      ('Hazelnut', 'Kaffee Frappe', 'Bulli', 160),
      ('Hazelnut Mocha', 'Kaffee Frappe', 'Bulli', 160),
      ('Salted Caramel', 'Kaffee Frappe', 'Bulli', 160),
      ('Oreo Coffee', 'Kaffee Frappe', 'Bulli', 160),
      ('Dirty Matcha', 'Kaffee Frappe', 'Bulli', 160),
      ('Kombiccino', 'Kaffee Frappe', 'Bulli', 170),
      ('Black Tea', 'Non-Kaffee Latte', 'Kafer', 0),
      ('Black Tea', 'Non-Kaffee Latte', 'Hippie', 0),
      ('Black Tea', 'Non-Kaffee Latte', 'Bulli', 0),
      (
        'Black Tea Latte',
        'Non-Kaffee Latte',
        'Kafer',
        0
      ),
      (
        'Black Tea Latte',
        'Non-Kaffee Latte',
        'Hippie',
        0
      ),
      (
        'Black Tea Latte',
        'Non-Kaffee Latte',
        'Bulli',
        0
      ),
      ('Matcha Latte', 'Non-Kaffee Latte', 'Kafer', 0),
      ('Matcha Latte', 'Non-Kaffee Latte', 'Hippie', 0),
      ('Matcha Latte', 'Non-Kaffee Latte', 'Bulli', 0),
      ('Babyccino', 'Non-Kaffee Latte', 'Kafer', 0),
      ('Babyccino', 'Non-Kaffee Latte', 'Hippie', 0),
      ('Babyccino', 'Non-Kaffee Latte', 'Bulli', 0),
      ('Dark Babyccino', 'Non-Kaffee Latte', 'Kafer', 0),
      (
        'Dark Babyccino',
        'Non-Kaffee Latte',
        'Hippie',
        0
      ),
      ('Dark Babyccino', 'Non-Kaffee Latte', 'Bulli', 0),
      ('Strawberry Latte', 'Fruitee Latte', 'Kafer', 0),
      ('Strawberry Latte', 'Fruitee Latte', 'Hippie', 0),
      ('Strawberry Latte', 'Fruitee Latte', 'Bulli', 0),
      ('Blueberry Latte', 'Fruitee Latte', 'Kafer', 0),
      ('Blueberry Latte', 'Fruitee Latte', 'Hippie', 0),
      ('Blueberry Latte', 'Fruitee Latte', 'Bulli', 0),
      ('Mango Latte', 'Fruitee Latte', 'Kafer', 0),
      ('Mango Latte', 'Fruitee Latte', 'Hippie', 0),
      ('Mango Latte', 'Fruitee Latte', 'Bulli', 0),
      ('Mixed Berries', 'Fruitee Latte', 'Kafer', 0),
      ('Mixed Berries', 'Fruitee Latte', 'Hippie', 0),
      ('Mixed Berries', 'Fruitee Latte', 'Bulli', 0),
      (
        'John Lemon Ginger',
        'The Beetles Juice',
        'Kafer',
        0
      ),
      (
        'John Lemon Ginger',
        'The Beetles Juice',
        'Hippie',
        0
      ),
      (
        'John Lemon Ginger',
        'The Beetles Juice',
        'Bulli',
        0
      ),
      (
        'Paul Strawberry',
        'The Beetles Juice',
        'Kafer',
        0
      ),
      (
        'Paul Strawberry',
        'The Beetles Juice',
        'Hippie',
        0
      ),
      (
        'Paul Strawberry',
        'The Beetles Juice',
        'Bulli',
        0
      ),
      ('Ringo Mango', 'The Beetles Juice', 'Kafer', 0),
      ('Ringo Mango', 'The Beetles Juice', 'Hippie', 0),
      ('Ringo Mango', 'The Beetles Juice', 'Bulli', 0),
      (
        'George Blueberry',
        'The Beetles Juice',
        'Kafer',
        0
      ),
      (
        'George Blueberry',
        'The Beetles Juice',
        'Hippie',
        0
      ),
      (
        'George Blueberry',
        'The Beetles Juice',
        'Bulli',
        0
      ),
      ('Strawberry', 'Non-Kaffee Frappe', 'Bulli', 0),
      ('Blueberry', 'Non-Kaffee Frappe', 'Bulli', 0),
      ('Mango', 'Non-Kaffee Frappe', 'Bulli', 0),
      ('Mixed Berries', 'Non-Kaffee Frappe', 'Bulli', 0),
      ('Oreo', 'Non-Kaffee Frappe', 'Bulli', 0),
      ('Matcha', 'Non-Kaffee Frappe', 'Bulli', 0),
      ('Java Chips', 'Non-Kaffee Frappe', 'Bulli', 0),
      ('Pizza 2Pi Burger', 'Snacks', 'Regular', 190),
      ('Pizza Pi Burger', 'Snacks', 'Regular', 100),
      ('Double Grilled Cheese', 'Snacks', 'Regular', 90),
      ('Cheese Burger', 'Snacks', 'Regular', 90),
      ('Regular Burger', 'Snacks', 'Regular', 80),
      ('Hotdog Sandwich', 'Snacks', 'Regular', 80),
      ('Cheese Sticks', 'Snacks', 'Regular', 60),
      ('French Fries', 'Snacks', 'Regular', 60)
  ) AS seed(item_name, category_name, size_label, price)
  JOIN categories ON categories.name = seed.category_name
  JOIN menu_items ON menu_items.name = seed.item_name
  AND menu_items.category_id = categories.id
  JOIN sizes ON sizes.label = seed.size_label;