# Coffee Shop App: Project Context & Roadmap

*Last updated after Phase 4's barista workflow was built and linted clean (`npx eslint` + `npx tsc --noEmit` both pass on `app/barista-dashboard`). Reconciled against the actual files again. Section "Open items" lists what is still missing.*

**Toolchain note:** Next.js 16 + React 19.2. `npm run lint` is `eslint` (flat config, no path). The `react-hooks/set-state-in-effect` rule is active and strict — storing derived state in a `useEffect` that calls `setState` is a **lint error**, not a warning. Compute it with `useMemo` during render instead.

## Stack
- **Next.js** (App Router, TypeScript)
- **Neon** (managed Postgres, Singapore region): free tier, auto-suspends on idle (expect ~3–4s cold start on first request after idle)
- **NextAuth.js** (Credentials provider): staff/admin login only, no public customer accounts (**not implemented yet**)
- DB access via **`pg`**, through `app/lib/db.ts` exporting a **default export** `pool` (`import pool from "@/app/lib/db"`)
- **Zustand**: `useOrderStore` (cart, persisted to `localStorage`) and `useBaristaStore` (barista-side queue, **mock/local only, still used only by `/order-queue` — retire in Phase 4**)

---

## Database: fully designed & seeded

All 11 tables plus `daily_counters` are live in Neon. `latest_schema.sql` has the `CREATE TABLE` statements, but it is **out of date** (see Step 5 below).

| Table | Purpose |
|---|---|
| `categories` | Menu groupings |
| `staff` | Barista/admin accounts (owner-created only) |
| `menu_items` | Sellable items: name, category_id, image_url, is_available. **No price here.** |
| `sizes` | label, oz (nullable), temperature (nullable) |
| `menu_item_sizes` | Join table: price of an item at a given size |
| `ingredients` | Inventory master list, **not yet seeded**. `unit` is free-text `VARCHAR(20)`; UI offers g, ml, kg, L, pumps, scoops, packs |
| `recipes` | Item → ingredient quantities, **not yet seeded** |
| `add_ons` | Universal extras. `id`, `name`, `price NUMERIC(10,2)`, `is_available BOOLEAN DEFAULT TRUE`, `image_url VARCHAR(255)` (nullable) |
| `orders` | daily_number + order_date + status + total |
| `order_items` | menu_item_id + size_id + quantity + **unit_price** (price snapshot) |
| `order_item_addons` | add-ons per order item, with quantity + **price** (price snapshot) |
| `daily_counters` | Helper table: one row per `order_date` (PK), `last_number INT NOT NULL DEFAULT 0`. Generates `orders.daily_number` safely under concurrency |

### Key facts to remember
- **Price snapshotting**: `order_items.unit_price` and `order_item_addons.price` are copied from current prices at insert time inside `/api/orders`. **Never trust a price sent from the client.**
- **`menu_items.name` is NOT unique.** Duplicate names exist across categories. Match on name + category, or better `item_id`.
- **Sizes**: Kafer (12oz, hot), Hippie (16oz, iced), Bulli (22oz, iced), Regular (null/null, snacks only). Not every item has every size.
- **`add_ons.image_url`**: `NULL` is a valid, permanent state. The frontend falls back to `/drinks/no-drink-image.svg` when `imgUrl` is null.
- Menu item images are still all placeholder `/drinks/no-drink-image.svg`. Real image hosting for `menu_items` is deferred.
- **Ingredient units decision**: track each ingredient in the unit it's actually consumed in (g/ml/kg/L where weighed/measured; pumps/scoops/packs for syrups, powders, boxed items). **No unit-conversion layer**; conversion factors drift in real life and would make `stock_qty` silently inaccurate. Recipes will say e.g. "Vanilla Latte needs 2 pumps of Vanilla Syrup" and order placement does `stock_qty -= 2` directly.
- **Restock threshold decision**: raw number in the same unit as `stock_qty`, typed by the owner per ingredient. No auto-suggested defaults by unit. *Open item*: cosmetic placeholder on the threshold input (per-unit examples vs. one generic "Alert below this amount"). Not yet chosen.
- **Timezone**: Neon runs in UTC, so `CURRENT_DATE` rolls over at **8 AM Manila time**. `POST /api/orders` now uses `(NOW() AT TIME ZONE 'Asia/Manila')::date` for both the `daily_counters` insert and the `orders` insert, and `GET /api/orders` uses the same expression in its range filter. `orders.created_at` is zone-less UTC; `GET /api/orders` now selects `(o.created_at AT TIME ZONE 'UTC')` so `pg` doesn't re-interpret it as the Node process's local time. ✅
- Staff accounts: none created yet. `StaffAccess.tsx` is a **hardcoded mock** (`user` / `root`, any role). **All `/api/*` owner routes (including `?all=true` on the menu) are unauthenticated.**

---

## Roadmap

### Phase 1: Fix the data contract ✅ DONE
`app/api/menu/route.ts` `GET` joins `menu_items` → `categories` → `menu_item_sizes` → `sizes`, groups by `item_id`, converts `NUMERIC` with `Number(...)`. `MenuRow` and `MenuItem` types live in `app/lib/types.ts`. `OrderSummary` was added there too (used by `StatsCard` and `SalesReport`).

### Phase 2: Menu page ✅ DONE
`app/page.tsx` is a client component with fetch-on-mount. `MenuItem.tsx` and `ProductCard.tsx` take real data as props. `ProductCard` already falls back on image: `item.itemImg || "/drinks/no-drink-image.svg"`.

### Phase 3: Ordering flow ✅ DONE (frontend confirmed by reading the current file)
- `app/api/add-ons/route.ts`: `GET` available add-ons; `AddOn` type `{ addOnsId, name, price, imgUrl }`.
- `app/api/menu/[itemId]/route.ts`: single-item `GET`, parameterized query, 400/404 handling, and it returns `isAvailable`.
- `OrderPage` fetches real item + add-ons; loading and not-found guards are after all hooks. *Still an open cleanup*: it fetches the **full `/api/menu`** and `.find()`s client-side (line 28–30) even though `/api/menu/[itemId]` exists. Note the single-item route 404s unavailable items, which is correct for the customer page.
- `AddOns.tsx`, `OrderCard.tsx`, `order-list/page.tsx` all off mock data.
- `app/api/orders/route.ts` `POST`: one checked-out `pg` client, `BEGIN` → atomic `daily_counters` increment (Manila date) → insert `orders` (total 0 placeholder) → per item: re-look-up `menu_item_sizes.price`, insert `order_items` with snapshot → per add-on: re-look-up `add_ons.price`, insert `order_item_addons` (quantity hardcoded 1, price charged once per item quantity) → `UPDATE orders SET total` → `COMMIT`; `ROLLBACK` on any throw; `finally` releases the client. Returns 201 `{ message, orderReference, total }` with `orderReference = String(dailyNumber).padStart(4,'0')`.
- Payload shape: `{ items: { itemId, sizeId, quantity, addOnIds }[] }`. The field is `itemId`, not `menuItemId`; don't introduce a second name.
- `sizeId` is threaded through `types.ts`, both menu routes, and `SizeSelector.tsx`'s `Size` type.
- `PlaceOrderButton.tsx` is **rewritten and applied**: builds the payload from `useOrderStore` (IDs only, `o.selectedSize.sizeId`, `o.selectedAddOn`), POSTs to `/api/orders`, has `isSubmitting` + `error` state, throws the server's `error` on `!res.ok`, and navigates to `/order-confirmation?ref=…&total=…` using the **server** values, then `clearOrder()`. The cart is only cleared on success. `order-confirmation/page.tsx` already reads `ref` and `total` from the query string. **This means orders placed through the UI now reach the database.**
- Cart `grandtotal` in `order-list/page.tsx` includes add-on prices: `(selectedSize.price + Σ selected add-on prices) × quantity`, using the fetched `addOns` list. Matches the server calculation.

### Phase 4: Barista workflow 🔨 MOSTLY BUILT
- **`PATCH /api/orders/[id]` — ✅ APPLIED** (new file `app/api/orders/[id]/route.ts`). Validates `status` against `["pending", "preparing", "ready"]` and 400s on anything else (plus 400 on a non-numeric id, 404 when no row matched). Returns `{ id, orderReference, status, total }`. **Status ordering is deliberately NOT enforced server-side** — the UI only offers the forward move, so server-side transition rules would just create a way to break the screen. A misclick is fixed by the revert path instead.
- **Barista dashboard — ✅ REWRITTEN for one-click flow.** `Dashboard.tsx` polls `GET /api/orders?range=today` every 3s and derives which order the card shows *during render* rather than storing it:
  - `focusedId` (`number | null`) is the barista's explicit click, if any.
  - `skipped` (`Set<string>`) holds dismissed orders keyed `id:status`, so an X doesn't permanently bury an order — if its status later changes, the key changes and it's eligible again. Crucially, the key doesn't change while the order sits unchanged, so X never causes it to re-nag every 3s.
  - `queue` = non-`ready` orders sorted oldest-first. `focusedOrder` = the clicked order if it still exists and isn't skipped, else the oldest non-skipped queue entry.
  - **Behaviour**: the card auto-opens the longest-waiting order; "Mark as Preparing" **keeps the card open** on the same order; only "Mark as Ready" advances. Clicking order 2 then finishing it falls back to order 1 if order 1 is still pending. Net: one click per order. A new order arriving never interrupts the open card. Skipped rows stay clickable; clicking one clears its skip.
  - `ready` rows render at `opacity-40` so attention stays on active work. Skipped rows are **not** dimmed.
  - Finished orders are still clickable and inspectable; `focusedOrder` resolves `focusedId` against `orders`, not `queue` (otherwise clicking a `ready` row would silently open a different order).
- **Revert path — ✅ ADDED** in `OrderDetailModal.tsx`: a `ready`-only "Move Back to Preparing" button behind an **in-app** confirm overlay (`z-[60]` above the card's `z-50`, sibling inside the same `fixed inset-0`). Cancel leaves the detail card open.
  - *Do not use `window.confirm` / `window.prompt` / `alert` for new UI.* Native dialogs title themselves with the page origin, so they render as "localhost" regardless of the message, and they break the visual style. This bit the revert confirm; `inventory/page.tsx`'s `handleRestock` prompt and the owner menu's `handleDelete` confirm are the remaining native dialogs.
- **Still to do**: `/order-queue` is the last mock holdout — it still imports `useBaristaStore` and its 3s `setInterval` body is **empty** (lines 20–27). Switch it to `GET /api/orders` with the same polling pattern as the dashboard, then delete `store/BaristaStore.ts` and `app/lib/data.tsx` (both have no remaining importers).
- **Open design question**: no "cancel" for baristas. An order the customer never collects stays `ready` forever and re-sends on every poll.

### Phase 5: Owner/admin features 🔨 MOSTLY APPLIED

**Routes**: `categories` GET, `sizes` GET, `ingredients` GET/POST, `ingredients/[id]` PATCH/DELETE, `menu` POST, `menu/[itemId]` GET/PATCH/DELETE.

**Components/pages**: owner menu page, `AddItemModal`, `EditItemModal`, `AddingIngredientModal`, inventory page, `StatsCard`, sales report.

**Step 1: menu availability + Delete — ✅ APPLIED (verified in files)**
1. `types.ts`: `is_available` on `MenuRow`, `isAvailable` on `MenuItem`.
2. `GET /api/menu` accepts `?all=true` (`WHERE ($1::boolean OR mi.is_available = TRUE)`, `ORDER BY mi.id, s.id`); `[itemId]` GET also returns `isAvailable`, orders by `s.id`, and still filters to available items (404 for unavailable), intended for the customer order page.
3. `MenuItemCard`: toggle thumb is a sibling of the input so `peer-checked:` works; `onDelete` prop wired to the Delete button; `src={item.itemImg ?? '/drinks/no-drink-image.svg'}`. **Still shows a raw `null` category** — the "Uncategorized" fallback mentioned earlier is not in the card (the filter page handles it separately).
4. `DELETE /api/menu/[itemId]`: 404 if missing; **409** ("This item has past orders. Mark it unavailable instead.") on FK violation `23503`.
5. Owner menu page: `fetchMenu` uses `/api/menu?all=true` and seeds `itemAvailability` via `Object.fromEntries`; toggle is optimistic and **reverts on PATCH failure** (checks `response.ok`); `handleDelete` confirms first and alerts on failure; `onDelete` passed to the card.
- *Tests still to report*: toggle off → refresh → stays off and shows under "Unavailable"; thumb slides; customer menu hides unavailable item; delete a fresh item; try deleting an ordered item → 409 alert.

**Step 2: backend — ✅ APPLIED (both bugs fixed)**
- **2a Atomic restock**: `PATCH /api/ingredients/[id]` accepts `stockDelta` and does `stock_qty = COALESCE($3, stock_qty) + COALESCE($6::numeric, 0)`; inventory page `handleRestock` sends `{ stockDelta: amount }`.
  - The `::numeric` cast is **load-bearing**: without it Postgres infers `integer` from the `0` literal and a restock of `2.5` fails. Now fixed in the applied file.
- **2b Manila timezone in `POST /api/orders`**: both `CURRENT_DATE` uses are `(NOW() AT TIME ZONE 'Asia/Manila')::date`. ✅
- **2c `GET /api/orders`**: ✅ applied (user's own version). `?range=today|week|month|all` maps to a `daysBack` record — `today: 0`, `week: 6` (last 7 days incl. today), `month: 29` (last 30 days), `all: null` — filtered with `o.order_date >= (NOW() AT TIME ZONE 'Asia/Manila')::date - $1::int`. Optional parameterized `?status=`. Returns `id, orderReference, status, createdAt, total, items[{ name, size, quantity, unitPrice, addOns[] }]` via `json_agg` with `FILTER`/`COALESCE`, and `created_at` is read as `(o.created_at AT TIME ZONE 'UTC')`. `OrderSummary` is in `types.ts`. ✅
  - Note: the doc's earlier "unknown range falls back to today / invalid status returns `[]`" is **not** what the code does — both invalid `range` and invalid `status` now return **400**. That's arguably better; just be aware the barista page must not send junk values.
- **Manual POST test (PowerShell)**: `{"items":[{"itemId":1,"sizeId":1,"quantity":2,"addOnIds":[1]}]}` returned `orderReference: 0002`, `total: 280`. Ids were guesses and 280 is unreconciled against real seed prices.
- **Still to run**: check `/api/orders?range=all` (items, add-on names, `createdAt` ≈ current Manila time, `?status=` filtering), post a second order to see the counter increment, place one order **through the UI** now that `PlaceOrderButton` is fixed, and in Neon run `SELECT * FROM order_items ORDER BY id DESC LIMIT 5;` and `SELECT * FROM order_item_addons ORDER BY id DESC LIMIT 5;` to confirm the snapshots.

**Step 3: frontend — ✅ APPLIED (verified in files)**
1. `PlaceOrderButton` rewritten as described in Phase 3. ✅
2. Cart `grandtotal` includes add-on prices. ✅
3. `StatsCard` fetches `/api/orders?range=today` and uses `o.total`; `SalesReport` fetches `/api/orders?range=${dateFilter}` with an `isMounted` guard, uses `total` / `createdAt`, and computes total / count / average / top seller. ✅
4. `specialInstruction` cleanup is **complete**: zero occurrences of `specialInstruction` or `SpecialInstructions` remain anywhere in the repo, and `SpecialInstructions.tsx` is gone. `OrderListStore`'s `addToOrder` / `removeOrder` both compare on `selectedSize.sizeId`. ✅
5. `app/lib/data.tsx` (mock menu) now has **no importers** and is safe to delete. ✅

**Step 4: small bugs found in the repo review — ✅ ALL APPLIED**
- `Header.tsx`: `src="/brown-menu.svg"` ✅
- `ViewOrderBar.tsx`: `router.push('/order-list')` ✅
- `barista-dashboard/page.tsx`: `min-h-screen` ✅
- `SpecialInstructions.tsx` deleted ✅
- `SideNav.tsx` footer still says **© 2025** (owner nav says 2026) — *still outstanding, cosmetic*.

**Step 5: housekeeping — ⏳ NOT DONE**
- `latest_schema.sql` is missing `daily_counters` and `add_ons.image_url`; both exist in Neon. Add them so the file matches the live database. (Verified: only one `image_url` exists, on `menu_items`.)
- `app/lib/data.tsx` is now orphaned and can be deleted.

---

## Open items / gaps
- **No auth** on any owner route or page (NextAuth not implemented; `?all=true` and all mutations are open). Biggest structural risk left.
- `MenuItemCard` renders a raw `null` category; needs the "Uncategorized" fallback.
- `OrderPage` still fetches all of `/api/menu` instead of `/api/menu/[itemId]`.
- `/order-queue` is still on `useBaristaStore` with an empty poll body; `store/BaristaStore.ts` and `app/lib/data.tsx` are dead once that's done.
- **Native browser dialogs remain in two places**: `inventory/page.tsx`'s restock `window.prompt` and the owner menu's delete `window.confirm`. Both show "localhost" as the title and don't match the app's styling. Replace with in-app modals, following the revert-confirm pattern in `OrderDetailModal.tsx`.
- Ingredient Delete has no confirmation dialog; ingredient **Edit** modal not built.
- Owner modals fetch categories/sizes inline on every open; could be cached.
- `SideNav.tsx` © 2025 → 2026.
- `orders/[itemId]/page.tsx` types its local add-ons as `imgUrl: string` while the API's `AddOn.imgUrl` is nullable. Harmless (the `??` fallback covers it) but the type is wrong.
- Consider whether Delete should be hidden in favor of "unavailable" for items with order history (currently it 409s with a message).
- Scaling: `?range=today` re-sends every order including all of day's `ready` ones, every 3s. Fine at café volume; if it drags, use `?status=pending` plus a second fetch for `preparing` rather than filtering a growing array client-side.

**Still to do in Phase 5**: seed `ingredients`; recipe-linking UI (menu item ↔ ingredient ↔ raw quantity, no conversion); ingredient deduction on order placement inside the `/api/orders` transaction (`stock_qty -= quantity_needed × item quantity`, guarded by `CHECK (stock_qty >= 0)`, and decide what happens when stock is insufficient); image hosting migration for `menu_items`.

### Phase 6: Data quality & edge cases
Validate required fields before insert, default image/size/temperature labels, null-safe admin forms, filter invalid records in queries.

### Phase 7: Polish & testing
Test drinks + snacks together, order placement, barista status updates, admin CRUD, inventory changes, no-image/no-category cases. Replace mock staff login with NextAuth + `bcrypt`-hashed `staff` rows; gate owner/barista pages and `/api/*` mutations by session role.

---

## Working style notes (for continuity)
- **Standing instruction: every code block/file written must start with a brief comment stating its purpose** (e.g. `// Fetches a single menu item by itemId, joined with category/size/price data`). Keep inline comments light beyond that: only non-obvious lines (new syntax, a gotcha, a tricky conversion).
- User is learning: prefers **step-by-step conceptual guidance over ready-made code** for core logic (typing, grouping loops, SQL joins, React state/effects, async loading), built up incrementally with checks. Direct code is fine for boilerplate/mechanical fixes, and when the user explicitly says "you do it" or asks for everything at once; default back to step-by-step unless told otherwise.
- When something errors, ask for the exact error text before guessing. Server-side errors show in the terminal, not just the browser's JSON response.
- User is on **Windows using PowerShell**: use `Select-String`/`Get-ChildItem` or `findstr`, not `grep`.
- Prefers being walked through *why*, not just *what*, even for small syntax/conceptual points.
- When a fix surfaces a genuine design decision, pause and reason through options with the user rather than picking silently. For design/tradeoff questions, give a clear recommendation with reasoning rather than a menu of options. Favor honesty over false precision.
- When the user pastes their own draft, check it line-by-line against names/types already agreed on before assuming the logic is wrong (many past errors were pure naming mismatches, e.g. `menuItemId` vs `itemId`). Name the two disagreeing identifiers.
- User sometimes pastes stale code from earlier in the chat. Ask whether it's the current file before diagnosing. **Also applies to repo snapshots and to this doc** — cross-check against the actual repo before acting.
- Apply big batches **one small testable group at a time**, and list what to test after each. Before moving on, confirm each earlier step was actually applied, since delivered ≠ applied.
- When the user pastes their own working version of a delivered function, compare behavior, keep theirs when equivalent, flag only real bugs, and warn against pasting a second copy (duplicate exports error).
