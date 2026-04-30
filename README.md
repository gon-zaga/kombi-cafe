================================================================================
KOMBI CAFE — ORDERING MANAGEMENT SYSTEM WITH INVENTORY MANAGEMENT
Project Summary | Development Chat Context
City College of Calamba · BSIT · Software Engineering 1 · March 2026
================================================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PROJECT OVERVIEW
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A web-based Ordering Management System built for Kombi Coffee, a small hidden
cafe in San Cristobal, Calamba City, managed by Mr. Sherwin Tunay. The system
replaces manual verbal ordering and notebook-based recording with a fully
digital ordering and inventory platform.

Research paper title:
"Ordering Management System with Inventory Management for Kombi Coffee"
Evaluated using: ISO/IEC 25010 Software Quality Model
(Interaction Capability + Performance Efficiency)

Software Development Methodology: Agile (Scrum)

- Product Owner : Mr. Sherwin Tunay
- Sprints : Each feature phase (ordering → barista → admin → inventory)
- Backlog : Development roadmap below
- Chosen because requirements changed multiple times during development

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2. TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend : Next.js 16 + React 19 + TypeScript
Styling : Tailwind CSS v4 (mobile-first, breakpoints: md: lg: xl:)
State : Zustand (persist middleware — temporary for demo only)
Backend : Next.js API Routes (no Express)
Database : PostgreSQL + Node.js pg (raw SQL, no Prisma)
Real-time : setInterval polling (no paid real-time services)
Deployment : Local network demo — one machine, others connect via local IP
package.json : "type": "module" — required for Next.js App Router

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3. SYSTEM ROLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Customer

- Browse menu, filter by category
- Customize items (size, add-ons, quantity)
- Place orders digitally via QR-based platform
- View order confirmation with 4-digit daily reference number (0001, 0002...)

Barista

- Receive system-generated order tickets
- Update order status: Pending → Preparing → Ready
- Verify orders before preparation

Owner/Admin

- Manage menu items (add/edit/remove)
- Manage categories
- Monitor ingredient stock levels and restocking alerts
- Update prices per size
- View sales reports (daily/weekly/monthly)

Staff access: Hamburger icon (top-left of Header) → SideNav drawer →
role selector (Barista / Admin) → login form appears after role is selected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 4. COMPLETED FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Customer Ordering Flow
[x] Menu browsing with category filtering (CategoryBar)
[x] Item customization page — size, add-ons, quantity
NOTE: special_instructions removed from UI and database
[x] OrderListStore.ts — Zustand store with addToOrder, removeOrder, clearOrder - Duplicate detection: same item + same customization = increment quantity - persist middleware (localStorage) — temporary, removed when DB is wired
[x] OrderCard — image, name, size, price, add-ons, quantity, delete button
[x] PlaceOrderButton — generates 4-digit daily number, navigates to confirmation - router.push called before clearOrder to prevent EmptyOrder flash
[x] ViewOrderBar — quantity badge, navigates to order list
[x] order-list/page.tsx — OrderCards, grand total, EmptyOrder fallback - Uses hasHydrated() guard to prevent rendering before Zustand loads
[x] EmptyOrder — centered empty state with Browse Menu button
[x] order-confirmation/page.tsx — ref + total from search params

Staff Side Navigation
[x] Hamburger icon (top-left) added to Header
[x] SideNav drawer — slides in from left with blurred backdrop
[x] Role selector toggle (Barista / Admin) — clears form on switch
[x] Login form — auto-focus, ESC to close, error message on wrong credentials
[x] Mock credentials: barista/barista123, owner/owner123
[x] On login: routes to /barista-dashboard or /owner-dashboard depending on role

Staff Access Page (side-navigation/page.tsx)
[x] Rebuilt as a standalone centered login page
[x] Two role buttons shown first: Barista / Admin
[x] Login form appears only after a role is selected
[x] Selected role button highlights in amber
[x] Login button label updates: "Login as Barista" / "Login as Admin"
[x] Uses useState for role selection — "use client" directive added

Responsive Design
[x] Next.js handles viewport meta tag automatically — no manual tag needed
[x] viewport export separated from metadata export in side-navigation page
[x] Tailwind mobile-first: bare classes = mobile, md: lg: = larger screens
[x] @container not used at page level — regular breakpoints used instead

Database Setup
[x] pg + @types/pg installed
[x] Next.js upgraded to 16.2.4 (fixed high severity DoS vulnerability)
[x] .env.local created at project root with DATABASE_URL
[x] kombi_cafe database created in PostgreSQL
[x] lib/db.ts created — pg Pool connection file
[x] lib/schema.sql finalized — all tables defined (see Section 9)

Bug Fixes Resolved
[x] TypeScript error on useOrderStore.persist.onFinishHydration
→ Fixed by adding createJSONStorage to persist config
[x] Hydration flash bug on order-list page
→ Fixed using hasHydrated() check before subscribing to onFinishHydration
[x] EmptyOrder showing briefly when placing order
→ Fixed by calling router.push before clearOrder
[x] "Unsupported metadata viewport" warning in side-navigation
→ Fixed by moving viewport into its own export const viewport = { ... }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 5. DEVELOPMENT ROADMAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[DONE] Customer ordering flow (full)
[DONE] Staff side nav + login UI (mock auth)
[DONE] Staff access page — role-gated login form
[DONE] Responsive design groundwork — mobile-first Tailwind approach
[DONE] PostgreSQL database schema finalized (lib/schema.sql)
[NEXT] Create separate dashboard folders: barista-dashboard/ and owner-dashboard/
[NEXT] Run schema.sql in pgAdmin to create all tables
[NEXT] Create API routes under /app/api/
[NEXT] Start with menu items API or orders API
[NEXT] Wire frontend to use API instead of Zustand persist
[NEXT] Barista dashboard — incoming order queue, status update controls
[NEXT] Order status page — Pending → Preparing → Ready
[PLANNED] Owner/admin dashboard — menu management, ingredient inventory
[PLANNED] Ingredient-based stock deduction on order placement
[PLANNED] Restocking alerts when stock_qty <= restock_threshold
[PLANNED] Sales reporting — daily/weekly/monthly summaries
[PLANNED] Real-time updates via setInterval polling
[TBD] Admin authentication strategy (replace mock credentials)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 6. RESEARCH PAPER ALIGNMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Functionality                          | In Paper | Status                            |
| -------------------------------------- | -------- | --------------------------------- |
| Order management (digital + tracking)  | YES      | Customer flow done. Barista next. |
| Inventory monitoring + alerts          | YES      | Schema done. API next.            |
| Menu management (owner add/edit/rm)    | YES      | Planned in admin dashboard        |
| Sales reporting (daily/weekly/monthly) | YES      | Planned in admin dashboard        |
| Three roles: Customer, Barista, Owner  | YES      | Login done. Role views next.      |
| Payment integration                    | EXCLUDED | Out of scope per paper            |
| Online ordering / delivery             | EXCLUDED | In-store only by design           |
| Supplier mgmt + inventory forecasting  | EXCLUDED | Basic ingredient monitoring only  |

Quality Evaluation (per research paper):

- ISO/IEC 25010: Interaction Capability + Performance Efficiency
- Instrument: Four-Point Likert Scale survey questionnaire
- Analysis: Weighted Mean formula

Software Development Methodology:

- Agile / Scrum
- Sprints map to feature phases in the roadmap
- Chosen due to evolving requirements throughout development

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 7. KEY TECHNICAL DECISIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Customization is a page, not a modal
- Same item + same customization = increment quantity (no duplicates)
- special_instructions removed from both UI and database
- Reference number is a 4-digit daily counter (0001, 0002...) resets each day
  → Stored as daily_number INTEGER + order_date DATE with UNIQUE constraint
  → Frontend formats with padStart(4, '0')
- Price lives in sizes table, not menu_items (each size has its own price)
- Sizes are fixed (not per menu item) — 3 sizes total:
  Kafer 12oz hot ₱120
  Hippie 16oz iced ₱110
  Bulli 22oz iced ₱120
- Some menu items only have one size → menu_item_sizes junction table
- Categories are a separate table (not VARCHAR + CHECK) — owner can manage them
- Inventory tracks ingredients, not menu items directly
  → ingredients table: name, unit, stock_qty, restock_threshold
  → recipes table: links menu items to ingredients + quantity needed per order
  → System calculates how many drinks can be made from remaining ingredients
  → When order placed: deduct ingredients used via recipes table
  → When stock_qty <= restock_threshold: trigger restocking alert
- No ENUM types — using VARCHAR + CHECK constraints (easier to modify)
- No table name prefixes (no kombi_staff etc.) — database name provides context
- Staff table uses user_id (not id) as primary key column name
- Staff profile fields added: first_name, last_name, started_at, birthdate
- persist middleware is temporary — removed when PostgreSQL backend is ready
- No Prisma — raw SQL with pg
- No Express — Next.js API Routes only
- No paid real-time features — polling via setInterval only
- Demo runs offline on one machine; other devices connect via local IP
- Tailwind mobile-first: bare classes = mobile, md:/lg: for larger screens
- viewport meta tag is auto-handled by Next.js
- Staff access login: role selected first (Barista/Admin), then form appears
- Separate dashboard folders for barista and owner:
  → /barista-dashboard — order queue, status updates
  → /owner-dashboard — menu management, inventory, sales reports
  → Each role has distinct features and UI requirements
  → Allows independent development and easier role-based access control

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 8. DATABASE CONNECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.env.local (project root — same level as app/ folder):
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/kombi_cafe

lib/db.ts:
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default pool;

Import pool in any API route to run queries.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 9. DATABASE SCHEMA (lib/schema.sql) — FINALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ============================================================
-- KOMBI CAFE — DATABASE SCHEMA
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
id SERIAL PRIMARY KEY,
name VARCHAR(50) UNIQUE NOT NULL
);

-- Staff (Barista / Admin)
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

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
category_id INTEGER REFERENCES categories(id),
image_url TEXT,
available BOOLEAN DEFAULT TRUE
);

-- Sizes (fixed 3 sizes across all items)
CREATE TABLE IF NOT EXISTS sizes (
id SERIAL PRIMARY KEY,
label VARCHAR(20) NOT NULL,
oz NUMERIC(5, 1) NOT NULL,
temperature VARCHAR(10) NOT NULL CHECK (temperature IN ('hot', 'iced')),
price NUMERIC(10, 2) NOT NULL
);

-- Menu Item Sizes (which sizes are available per menu item)
CREATE TABLE IF NOT EXISTS menu_item_sizes (
id SERIAL PRIMARY KEY,
menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
size_id INTEGER REFERENCES sizes(id) ON DELETE CASCADE
);

-- Ingredients (master list of all ingredients)
CREATE TABLE IF NOT EXISTS ingredients (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
unit VARCHAR(20) NOT NULL,
stock_qty NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
restock_threshold NUMERIC(10, 2) NOT NULL DEFAULT 10,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes (which ingredients each menu item needs and how much)
CREATE TABLE IF NOT EXISTS recipes (
id SERIAL PRIMARY KEY,
menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
quantity_needed NUMERIC(10, 2) NOT NULL
);

-- Add-ons
CREATE TABLE IF NOT EXISTS add_ons (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
price NUMERIC(10, 2) NOT NULL
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
id SERIAL PRIMARY KEY,
daily_number INTEGER NOT NULL,
order_date DATE NOT NULL DEFAULT CURRENT_DATE,
total NUMERIC(10, 2) NOT NULL,
status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready')),
created_at TIMESTAMP DEFAULT NOW(),
UNIQUE (daily_number, order_date)
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
id SERIAL PRIMARY KEY,
order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
menu_item_id INTEGER REFERENCES menu_items(id),
size_id INTEGER REFERENCES sizes(id),
quantity INTEGER NOT NULL DEFAULT 1
);

-- Order Item Add-ons
CREATE TABLE IF NOT EXISTS order_item_addons (
id SERIAL PRIMARY KEY,
order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
add_on_id INTEGER REFERENCES add_ons(id)
);
-- ============================================================
-- TABLE RELATIONSHIPS SUMMARY
-- ============================================================

-- orders ──< order_items ──< order_item_addons
-- menu_items ──< order_items
-- sizes ──< order_items
-- menu_items ──< menu_item_sizes >── sizes
-- menu_items ──< recipes >── ingredients
-- categories ──< menu_items
-- add_ons ──< order_item_addons
-- staff (standalone — manages login)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 10. KNOWN ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No open blocking issues. All previously reported bugs resolved (see Section 4).

================================================================================
NOTE: Update this file each session to keep the new chat context aligned
with both the codebase and the research paper as it gets finished.
Last updated: April 2026
================================================================================
