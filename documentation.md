# Database Setup Documentation

## Project Overview

Coffee shop ordering/inventory system built with Next.js, using Neon (managed Postgres) as the database, and NextAuth.js (Credentials provider) for staff login.

---

## 1. Infrastructure Decisions

| Decision          | Choice                             | Reason                                                                             |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| Database provider | Neon (Postgres 18)                 | Free tier, no time limit, sufficient at current scale                              |
| Region            | Singapore                          | Closest region to the Philippines                                                  |
| Auth              | NextAuth.js (Credentials provider) | Only staff/admins log in — no public customer accounts, so Neon Auth wasn't needed |
| DB driver         | `pg` (npm)                         | Standard Node Postgres client, installed in the Next.js project                    |

**Connectivity confirmed:** a test API route (`app/api/test-db/route.js`) successfully queried the live Neon database and returned a timestamp, verifying the Next.js app can talk to Postgres.

**Note on hosting:** the database is a separate, always-on cloud service — it works identically whether the Next.js app is running on `localhost` or deployed publicly. Deployment (e.g. to Vercel) is not a prerequisite for building out the database.

---

## 2. Schema Design

The schema was built and then revised twice based on real requirements surfaced during review.

### Tables

| Table               | Purpose                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| `categories`        | Menu groupings (e.g. Kaffee, Snacks)                                            |
| `staff`             | Barista/admin login accounts, created by the owner (admin), not self-registered |
| `menu_items`        | Core list of sellable items                                                     |
| `sizes`             | Size options — label, oz, temperature                                           |
| `menu_item_sizes`   | Join table: price of a specific item at a specific size                         |
| `ingredients`       | Inventory master list with stock levels and restock thresholds                  |
| `recipes`           | Join table: which ingredients (and how much) each menu item consumes            |
| `add_ons`           | Optional extras (e.g. extra shot, whip cream)                                   |
| `orders`            | One row per customer order, with a daily order number and status                |
| `order_items`       | Line items within an order (item + size + quantity)                             |
| `order_item_addons` | Add-ons attached to a specific order item                                       |

### Issues Identified and Fixed

**1. Missing price history (critical fix)**
Original design only referenced `menu_item_id`/`size_id`/`add_on_id` in order records, with no stored price. If menu prices change later, historical orders would silently recalculate incorrectly when joined to current prices.

- **Fix:** added `unit_price` to `order_items` and `price` to `order_item_addons`, to be populated from current prices at the moment an order is placed. These values are frozen permanently regardless of future menu price changes.

**2. No quantity on add-ons**
Original design couldn't represent something like "extra shot x2" without duplicating rows.

- **Fix:** added `quantity` (default 1) to `order_item_addons`.

**3. `sizes` table assumed drinks-only**
`temperature` was `NOT NULL` with a `CHECK (hot/iced)`, and `oz` was `NOT NULL`. This broke once the real menu was confirmed to include snacks/pastries (e.g. a "Regular" size for a burger, which is neither hot nor iced).

- **Fix:** made `oz` and `temperature` nullable on `sizes`, so non-drink items can use a generic size without a fake temperature value. Drink sizes still store real oz/temperature.

**4. Missing indexes on foreign key columns**
Postgres auto-indexes primary keys but not foreign keys. Left unindexed, common queries (e.g. "all order_items for this order") would require full table scans as data grows.

- **Fix:** added indexes on all foreign key columns across `menu_items`, `menu_item_sizes`, `recipes`, `order_items`, and `order_item_addons`.

**5. Minor addition**
Added `is_available` to `add_ons`, matching the existing flag on `menu_items`, so an add-on can be temporarily disabled without deleting it.

### Final Table Design Note — `sizes`

Real values confirmed for drink sizes:

| Label   | Oz  | Temperature                  |
| ------- | --- | ---------------------------- |
| Kafer   | 12  | hot                          |
| Hippie  | 16  | iced                         |
| Bulli   | 22  | iced                         |
| Regular | —   | — (used for snacks/pastries) |

---

## 3. Images

`menu_items.image_url` stores a URL/path only — the database does not store image files directly.

- **Current stage:** use placeholder paths under `/public/images/` in the Next.js project (fine while manually seeding and developing locally).
- **Future stage:** once an admin "add/edit menu item" page is built (so the owner can upload photos without a code change), migrate to a hosted image service such as Cloudinary, Vercel Blob, or Supabase Storage. No schema change is required for this migration — only the URL value changes.

---

## 4. Staff Account Creation

Confirmed workflow: the owner (admin) creates employee accounts — there is no public self-signup.

- No schema change needed; `staff` already supports this.
- Implementation is an application-layer concern: an admin-only page/route, gated by NextAuth session + `role = 'admin'` check, where the owner enters a new employee's details. Passwords must be hashed (e.g. via `bcrypt`) before insertion — never stored in plain text.

---

## 5. Menu Data (Source: Mockup)

Real menu data was provided from existing frontend mockup code (`menuItems` and `addOns` arrays), covering:

- **9 categories:** Kaffee, Klassik Kaffee, Specialty Kaffee, Kaffee Frappe, Non-Kaffee Latte, Fruitee Latte, The Beetles Juice, Non-Kaffee Frappe, Snacks
- **48 menu items** total, each with 1–3 sizes and per-size pricing
- **8 add-ons** with individual pricing

Note: many item prices in the mockup are placeholder `0` values — confirmed as mockup/testing data, not final pricing. Snacks/pastries were confirmed as part of the real planned menu (not just mockup filler), which is why the `sizes` table fix (#3 above) was necessary.

---

## Current Status

### ✅ Completed

- Neon project created and connected to Next.js
- Full schema designed, reviewed, and corrected (price snapshotting, add-on quantity, nullable size fields, FK indexes)
- Real menu/add-on data reviewed and ready for seeding
- Decisions finalized on image storage approach and staff account creation workflow

### ⏳ Not Done Yet

- Corrected schema not yet run in Neon (or needs re-running if the earlier uncorrected version was already applied)
- No seed data (`INSERT` statements) written yet for categories, sizes, menu items, menu_item_sizes, or add-ons
- Static/mockup data in the Next.js app not yet replaced with live database queries
- NextAuth.js staff login not yet implemented
- Admin page for staff account creation not yet built
- Image hosting migration (Cloudinary/Vercel Blob/Supabase) not yet needed, deferred until admin menu-editing page exists

### 🔜 Next Step

Run the corrected `schema.sql` in Neon's SQL Editor (or apply the `sizes` column changes via `ALTER TABLE` if the original version was already run), then generate and run seed SQL for `categories`, `sizes`, `menu_items`, `menu_item_sizes`, and `add_ons` using the real mockup data.
