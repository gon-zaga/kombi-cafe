# Coffee Shop App: Project Context & Roadmap

*Last updated after the reporting + confirmation work: `GET /api/orders` now accepts `?from=&to=` for an exact window alongside the existing named ranges; the owner dashboard and sales report share one date-range component (Today / Yesterday / This Week / This Month / This Year / All Time / Custom); the dashboard was restyled into a card grid with a Best Seller card and per-section CSV export; and every destructive action goes through a shared `ConfirmModal` with a 3-second button lock. `npx eslint` + `npx tsc --noEmit` pass on `app/`. Section "Open items" lists what is still missing.*

**Toolchain note:** Next.js 16 + React 19.2. `npm run lint` is `eslint` (flat config, no path). Two rules bite in practice and are **errors, not warnings**:
- `react-hooks/set-state-in-effect` — derived state computed in a `useEffect` is rejected. Use `useMemo` during render instead.
- `react/no-unescaped-entities` — literal `'` and `"` in JSX text must be `&apos;` / `&quot;`.

## Stack
- **Next.js** (App Router, TypeScript)
- **Neon** (managed Postgres, Singapore region): free tier, auto-suspends on idle (expect ~3–4s cold start on first request after idle)
- **NextAuth.js** (Credentials provider): staff/admin login only, no public customer accounts (**not implemented yet**)
- DB access via **`pg`**, through `app/lib/db.ts` exporting a **default export** `pool` (`import pool from "@/app/lib/db"`)
- **Zustand**: `useOrderStore` only (cart, persisted to `localStorage`). `useBaristaStore` / `store/BaristaStore.ts` was **deleted** once `/order-queue` moved to the real API. `app/lib/data.tsx` (mock menu) and the empty `app/barista-dashboard/ui/OrderQueue.tsx` stub were also deleted.

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
| `ingredients` | Inventory master list, **seeded by the owner**. `unit` is free-text `VARCHAR(20)`; UI offers g, kg, ml, L, pcs, packs, pumps, scoops. **No `expires_at` column** — expiry tracking was built and then reverted. |
| `recipes` | Item → ingredient quantities. **Now in use.** `size_id` is **nullable and live in Neon**: `NULL` = applies to every size, non-null = that size only and overrides the general row |
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
- **Ingredient units decision (re-confirmed)**: track each ingredient in the unit it's actually consumed in (g/ml/kg/L where weighed/measured; pumps/scoops/packs for syrups, powders, boxed items). **No unit-conversion layer, and deliberately none for now.** The bulk-purchase → recipe-consumption model (track stock in bottles, deduct in pumps, bridge with "1 bottle = 50 pumps") was evaluated and **deferred by decision**, not overlooked: the conversion would sit in the order transaction's hot path, so a wrong factor silently corrupts `stock_qty` forever. If it's ever adopted, put the conversion at the *purchase* boundary (extra columns for `purchase_unit` + `purchase_size` per ingredient) rather than in the deduction. No per-ingredient cost column exists yet, so there is no COGS/margin reporting. Unit dropdown offers g, kg, ml, L, pcs, packs, pumps, scoops.
- **Expiry tracking: NOT DONE, and currently reverted.** A full `ingredients.expires_at DATE NOT NULL` feature (add/edit forms, card badges, "Expiring Soon" banner) was built, then **reverted on request** the same session. Nothing about it remains in the code. It was raised because an opened jar of jam/milk has a real use-by date that a bulk sack doesn't.
  - *Why it was risky when it was attempted*: making it `NOT NULL` and required forces the owner to date-stamp things like espresso beans, where the date is meaningless and will end up faked — and a faked date is worse than a missing one because it looks trustworthy.
  - *If revisited*: the honest version is a nullable `expires_at` plus alerts, or a `batches` table (one row per open container, with `opened_at`), because one ingredient can have several open containers at once and a single column on `ingredients` can't represent that. Bulk/recipe unit conversion and expiry tracking are the same class of problem: a stored ratio that the app trusts.
- **Duplicate ingredient names**: enforced by `idx_ingredients_name_unique`, a functional unique index on `LOWER(TRIM(name))` so `Whole Milk` / `whole milk ` / `  Whole Milk` collide. ⚠️ **The index itself still has to be created in Neon by hand** — the app code assumes it exists. `POST /api/ingredients` uses `ON CONFLICT (LOWER(TRIM(name))) DO NOTHING` → **409**, deliberately refusing rather than updating (an upsert would let someone typing "whole milk" with stock 100 silently reset the real 20000). Seed scripts use `DO UPDATE` instead, since resetting stock to known values *is* the seed's job — same constraint, different intent per caller. `PATCH` maps 23505 → 409; `DELETE` maps 23503 → 409 so a recipe-linked ingredient can't be deleted out from under it.
- **Restock threshold decision**: raw number in the same unit as `stock_qty`, typed by the owner per ingredient. No auto-suggested defaults by unit. *Open item*: cosmetic placeholder on the threshold input (per-unit examples vs. one generic "Alert below this amount"). Not yet chosen.
- **Timezone**: Neon runs in UTC, so `CURRENT_DATE` rolls over at **8 AM Manila time**. `POST /api/orders` now uses `(NOW() AT TIME ZONE 'Asia/Manila')::date` for both the `daily_counters` insert and the `orders` insert, and `GET /api/orders` uses the same expression in its range filter. `orders.created_at` is zone-less UTC; `GET /api/orders` now selects `(o.created_at AT TIME ZONE 'UTC')` so `pg` doesn't re-interpret it as the Node process's local time. ✅
- **Recipes and stock deduction — ✅ BUILT (unverified end-to-end).** See "Phase 5 Steps 8–9" below for the design.
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

### Phase 4: Barista workflow ✅ DONE
- **`PATCH /api/orders/[id]` — ✅ APPLIED** (new file `app/api/orders/[id]/route.ts`). Validates `status` against `["pending", "preparing", "ready"]` and 400s on anything else (plus 400 on a non-numeric id, 404 when no row matched). Returns `{ id, orderReference, status, total }`. **Status ordering is deliberately NOT enforced server-side** — the UI only offers the forward move, so server-side transition rules would just create a way to break the screen. A misclick is fixed by the revert path instead.
- **Barista dashboard — ✅ REWRITTEN for one-click flow.** `Dashboard.tsx` polls `GET /api/orders?range=today` every 3s and derives which order the card shows *during render* rather than storing it:
  - `focusedId` (`number | null`) is the barista's explicit click, if any.
  - `skipped` (`Set<string>`) holds dismissed orders keyed `id:status`, so an X doesn't permanently bury an order — if its status later changes, the key changes and it's eligible again. Crucially, the key doesn't change while the order sits unchanged, so X never causes it to re-nag every 3s.
  - `queue` = non-`ready` orders sorted oldest-first. `focusedOrder` = the clicked order if it still exists and isn't skipped, else the oldest non-skipped queue entry.
  - **Behaviour**: the card auto-opens the longest-waiting order; "Mark as Preparing" **keeps the card open** on the same order; only "Mark as Ready" advances. Clicking order 2 then finishing it falls back to order 1 if order 1 is still pending. Net: one click per order. A new order arriving never interrupts the open card. Skipped rows stay clickable; clicking one clears its skip.
  - `ready` rows render at `opacity-40` so attention stays on active work. Skipped rows are **not** dimmed.
  - Finished orders are still clickable and inspectable; `focusedOrder` resolves `focusedId` against `orders`, not `queue` (otherwise clicking a `ready` row would silently open a different order).
- **Revert path — ✅ ADDED** in `OrderDetailModal.tsx`: a `ready`-only "Move Back to Preparing" button behind an **in-app** confirm overlay (`z-[60]` above the card's `z-50`, sibling inside the same `fixed inset-0`). Cancel leaves the detail card open.
  - *Do not use `window.confirm` / `window.prompt` / `alert` for new UI.* Native dialogs title themselves with the page origin, so they render as "localhost" regardless of the message, and they break the visual style. This bit the revert confirm. **Zero native dialogs remain** — all of them now go through `app/ui/ConfirmModal.tsx` (see "Phase 5 Step 11").
- **`/order-queue` — ✅ DONE.** Customer-facing display board (reachable from the menu's "Queue Display" button) listing reference numbers under PREPARING and READY. Now polls `GET /api/orders?range=today` every 3s using the same pattern as the dashboard, with an `isLoading` guard so the empty state only shows after a real load. `useBaristaStore` is gone from the app.
- **Open design question**: ~~no "cancel" for baristas~~ ✅ Resolved by `completed` (Step 13) — a collected order now leaves the board instead of re-sending on every poll.

### Phase 5: Owner/admin features 🔨 MOSTLY APPLIED

**Routes**: `categories` GET, `sizes` GET, `ingredients` GET/POST, `ingredients/[id]` PATCH/DELETE, `menu` POST, `menu/[itemId]` GET/PATCH/DELETE.

**Components/pages**: owner menu page, `AddItemModal`, `EditItemModal`, `AddingIngredientModal`, inventory page, `StatsCard`, sales report.

**Step 1: menu availability + Delete — ✅ APPLIED (verified in files)**
1. `types.ts`: `is_available` on `MenuRow`, `isAvailable` on `MenuItem`.
2. `GET /api/menu` accepts `?all=true` (`WHERE ($1::boolean OR mi.is_available = TRUE)`, `ORDER BY mi.id, s.id`); `[itemId]` GET also returns `isAvailable`, orders by `s.id`, and still filters to available items (404 for unavailable), intended for the customer order page.
3. `MenuItemCard`: toggle thumb is a sibling of the input so `peer-checked:` works; `onDelete` prop wired to the Delete button; `src={item.itemImg ?? '/drinks/no-drink-image.svg'}`. **Still shows a raw `null` category** — the "Uncategorized" fallback mentioned earlier is not in the card (the filter page handles it separately).
4. `DELETE /api/menu/[itemId]`: 404 if missing; **409** ("This item has past orders. Mark it unavailable instead.") on FK violation `23503`.
5. Owner menu page: `fetchMenu` uses `/api/menu?all=true` and seeds `itemAvailability` via `Object.fromEntries`; toggle is optimistic and **reverts on PATCH failure** (checks `response.ok`); the Delete button now only opens a `ConfirmModal` and `handleDelete` runs after the countdown (the old `window.confirm`/`window.alert` pair is gone), surfacing a 409 as a dismissible inline banner; `onDelete` passed to the card.
- *Tests still to report*: toggle off → refresh → stays off and shows under "Unavailable"; thumb slides; customer menu hides unavailable item; delete a fresh item; try deleting an ordered item → 409 alert.

**Step 2: backend — ✅ APPLIED (both bugs fixed)**
- **2a Atomic restock**: `PATCH /api/ingredients/[id]` accepts `stockDelta` and does `stock_qty = COALESCE($3, stock_qty) + COALESCE($6::numeric, 0)`; inventory page `handleRestock` sends `{ stockDelta: amount }`.
  - The `::numeric` cast is **load-bearing**: without it Postgres infers `integer` from the `0` literal and a restock of `2.5` fails. Now fixed in the applied file.
- **2b Manila timezone in `POST /api/orders`**: both `CURRENT_DATE` uses are `(NOW() AT TIME ZONE 'Asia/Manila')::date`. ✅
- **2c `GET /api/orders`**: ✅ applied, then **rewritten in Step 12** — the `daysBack` map described here no longer exists; ranges now resolve to Manila date bounds and `?from=&to=` is supported. Optional parameterized `?status=`. Returns `id, orderReference, status, createdAt, total, items[{ name, size, quantity, unitPrice, addOns[] }]` via `json_agg` with `FILTER`/`COALESCE`, and `created_at` is read as `(o.created_at AT TIME ZONE 'UTC')`. `OrderSummary` is in `types.ts`. ✅
  - Note: the doc's earlier "unknown range falls back to today / invalid status returns `[]`" is **not** what the code does — both invalid `range` and invalid `status` now return **400**. That's arguably better; just be aware the barista page must not send junk values.
- **Manual POST test (PowerShell)**: `{"items":[{"itemId":1,"sizeId":1,"quantity":2,"addOnIds":[1]}]}` returned `orderReference: 0002`, `total: 280`. Ids were guesses and 280 is unreconciled against real seed prices.
- **Still to run**: check `/api/orders?range=all` (items, add-on names, `createdAt` ≈ current Manila time, `?status=` filtering), post a second order to see the counter increment, place one order **through the UI** now that `PlaceOrderButton` is fixed, and in Neon run `SELECT * FROM order_items ORDER BY id DESC LIMIT 5;` and `SELECT * FROM order_item_addons ORDER BY id DESC LIMIT 5;` to confirm the snapshots.

**Step 3: frontend — ✅ APPLIED (verified in files)**
1. `PlaceOrderButton` rewritten as described in Phase 3. ✅
2. Cart `grandtotal` includes add-on prices. ✅
3. `StatsCard` (dashboard) and `SalesReport` both fetch `/api/orders` for the **selected range** via `buildOrdersQuery()` and use `o.total` / `createdAt`; the report has an `isMounted` guard and computes total / count / average / top seller. Both were restyled again in Step 12. ✅
4. `specialInstruction` cleanup is **complete**: zero occurrences of `specialInstruction` or `SpecialInstructions` remain anywhere in the repo, and `SpecialInstructions.tsx` is gone. `OrderListStore`'s `addToOrder` / `removeOrder` both compare on `selectedSize.sizeId`. ✅
5. `app/lib/data.tsx` (mock menu) had no importers — **deleted** along with `store/BaristaStore.ts` and the empty `app/barista-dashboard/ui/OrderQueue.tsx` stub. ✅

**Step 4: small bugs found in the repo review — ✅ ALL APPLIED**
- `Header.tsx`: `src="/brown-menu.svg"` ✅
- `ViewOrderBar.tsx`: `router.push('/order-list')` ✅
- `barista-dashboard/page.tsx`: `min-h-screen` ✅
- `SpecialInstructions.tsx` deleted ✅
- `SideNav.tsx` footer still says **© 2025** (owner nav says 2026) — *still outstanding, cosmetic*.

**Step 5: inventory UX — ✅ APPLIED**
- **`RestockModal.tsx`** (new): replaces the `window.prompt`. Shows the ingredient name and current stock, validates the amount is > 0, and sends `{ stockDelta }` so the DB adds rather than overwrites. `step="0.01"` because stock is tracked in g/ml where 2.5 is normal.
- **`EditIngredientModal.tsx`** (new): opened by clicking anywhere on an ingredient card. Edits **name, unit, threshold only — never stock**, because PATCH treats `stockQty` as a set value and this form must not be able to clobber real stock. Uses an outer-null-check + inner form split with `key={ingredient.id}`, so switching cards remounts and shows the right values (the render-phase `setState` approach trips `react-hooks/set-state-in-effect`).
- **Inventory page**: cards are now `cursor-pointer` with a hover shadow. Restock/Delete call `e.stopPropagation()` so they don't also trigger the card's edit handler.

**Step 6: defensive fetch — ✅ APPLIED (fixed a real crash)**
`inventory/page.tsx`, `StatsCard.tsx` and `sales-report/page.tsx` all did `await response.json()` and stored the result **without checking `response.ok`**. A failing route returns `{ error }`, not an array, so the page stored an object and every later `.filter()` threw `ingredients.filter is not a function`. All three now check the status and validate `Array.isArray` before storing. Worth remembering: this is why a missing DB column looked like "my data disappeared" — the data was fine, the query was failing.

**Step 8: recipes — ✅ BUILT (needs an end-to-end test)**
- **Schema (run in Neon ✅)**: `recipes.size_id INTEGER REFERENCES sizes(id) ON DELETE CASCADE` (nullable), `idx_recipes_size_id`, `CHECK (quantity_needed > 0)` added `NOT VALID`, and `idx_recipes_unique_row ON recipes (menu_item_id, COALESCE(size_id, 0), ingredient_id)`.
  - **`COALESCE(size_id, 0)` is required.** Postgres treats NULLs as distinct in a plain unique index, so without it the "All sizes" row could never collide with itself and duplicates would slip in.
- **`app/api/recipes/route.ts`**: `GET` (optional `?menuItemId=`) joins `ingredients` for name/unit; `POST` adds a row using `ON CONFLICT ... DO UPDATE`, so re-adding the same ingredient for the same item+size **updates the quantity instead of erroring**. Maps 23503/23514 → 400.
- **`app/api/recipes/[id]/route.ts`**: `DELETE` one row, 404 when absent.
- **`app/owner-dashboard/menu/ui/RecipeEditor.tsx`**: the recipe list + add/remove form. It is **not mounted directly in either modal's own `<form>`** — see `RecipeModal` below.
- **`app/owner-dashboard/menu/ui/RecipeModal.tsx`**: a **standalone** modal titled "Ingredients" with the item name beneath, opened only from a card's **Ingredients** button. Recipes were previously embedded at the bottom of `EditItemModal`, below Save/Cancel, where they were easy to miss and blurred two unrelated tasks together ("rename this drink" vs "what does this drink consume"). Keeping the editor in its own component means both modals can host it without nesting forms.
- **`app/owner-dashboard/menu/ui/IngredientPicker.tsx`**: searchable dropdown (type-to-filter on name, click-away layer, unit shown per row). Replaced a plain `<select>`, which stops being usable past ~15 ingredients. `AddingIngredientModal` is reused from the Inventory folder so both places open the identical dialog; it stacks above its host modal because both use `z-50` and it is later in the DOM.
- **`MenuItemCard.tsx`**: the **whole card opens Edit**, signalled three ways — `cursor-pointer`, a resting ring that thickens and turns amber on hover, and a "Click card to edit" hint under the name. Three buttons at the bottom: **Ingredients**, **Edit**, **Delete**.
  - ⚠️ Because the card is now clickable, **every inner control must call `e.stopPropagation()`** or it fires both handlers. **This actually bit us**: `MenuItemCard`'s toggle had `stopPropagation` on the `<input>`, but that input is `sr-only` — the visible pill and knob are sibling `<div>`s, so the real click never touched the input and bubbled up to the card's `onEdit`, opening Edit on every toggle flip. **Put `stopPropagation` on the `<label>`** (the actual hit target) as well as the input; a label click still forwards to its input, so `onChange` keeps working. General rule: stop propagation on the **visible wrapper**, not on the visually-hidden control.
- *Not verified*: the deduction below has never been run against real recipe data.

**Step 9: stock deduction on order placement — ✅ BUILT (needs an end-to-end test)**
- `deductRecipeStock()` in `app/api/orders/route.ts`, called inside the existing transaction right after each `order_items` insert.
- One shared SQL string (`recipeCostSql`) drives both the availability check and the `UPDATE`, so the two can never disagree.
- The size-override is done with an exclusion: rows matching the exact size are kept, `size_id IS NULL` rows are kept **only** where no size-specific row exists for that ingredient. So "2 pumps All sizes" plus "3 pumps Bulli only" deducts 3, not 5.
- **Shortage → 409** with the ingredient named and needs/have shown, thrown *before* any deduction so a failure can't leave some ingredients deducted. `ROLLBACK` removes the order row, and because the `daily_counters` increment is inside the same transaction, **failed orders must not consume reference numbers** — this is worth checking explicitly.
- *Deliberately recipe-only for now.* Add-on depletion would need an `add_ons.ingredient_id` column, and whipped cream's home is still unresolved. Adding it before recipes are proven risks double-counting.
- **Test still owed**: link Bacon to a snack, order ×1 → expect 120 → 118; order ×2 → 114. Then set stock to 3, order ×2 → expect 409, and confirm `SELECT COUNT(*) FROM orders WHERE created_at > now() - interval '2 minutes'` is unchanged.

**Step 10: housekeeping — ⏳ NOT DONE**
- `latest_schema.sql` is missing `daily_counters` and `add_ons.image_url`; both exist in Neon. Add them so the file matches the live database. (Verified: only one `image_url` exists, on `menu_items`.)
- `latest_schema.sql` now includes `idx_ingredients_name_unique`; that index still needs creating in Neon.
- `app/lib/schema.txt` is a **stale, misleading duplicate** of the schema and should be deleted. It predates the price-snapshot columns and has `sizes` with `NOT NULL` oz/temperature, no `daily_counters`, and no `add_ons.is_available`. Copying from it will produce broken SQL. `latest_schema.sql` at the repo root is the real one.

---

**Step 11: shared `ConfirmModal` — ✅ BUILT**
- **`app/ui/ConfirmModal.tsx`**: the single replacement for `window.confirm`/`alert`. Props: `isOpen`, `title`, `message`, `confirmLabel`, `cancelLabel`, `tone` (`"danger"` red / `"primary"` amber), `delayMs` (default **3000**), `onConfirm`, `onCancel`. Renders `null` when closed, so callers can leave it mounted and own the open state.
- **Both buttons, the backdrop click and Escape are locked during the countdown** — the confirm label itself shows the remaining seconds (`Delete (3)`). The rule is "no accidental answer", so Cancel is locked too; a 3s pause on an unwanted dialog is the deliberate cost.
- `tone="danger"` is for irreversible deletes; `tone="primary"` + `delayMs={0}` is for corrections that are themselves reversible (the barista revert).
- Wired into: staff delete in **both** `staff/ui/StaffTable.tsx` and `profile/ui/StaffTable.tsx`, owner menu item delete, ingredient delete, and the barista `OrderDetailModal` revert (which had a hand-rolled copy of this overlay, now deleted).
- Pattern at each call site: the button stores the target in state (`deletingStaff` / `deletingItem` / `deleting`), the modal's `onConfirm` runs the DELETE, and **server errors become an inline red banner, not an alert**.
- Lint traps hit while building it: the countdown reset is done with the render-phase `prevProps` pattern (`if (isOpen !== wasOpen) { setWasOpen(...); setRemaining(...) }`), not `useEffect`, or `react-hooks/set-state-in-effect` fires as an **error**; the `setTimeout` inside the effect is fine because it isn't a synchronous body call.

**Step 12: reporting + CSV export — ✅ BUILT (needs an end-to-end test)**
- **`GET /api/orders` date filtering, rewritten.** The old `daysBack` integer map is gone. `resolveRange()` turns a named range into concrete Manila `YYYY-MM-DD` strings, and the query is a plain `order_date >= $1 AND order_date <= $2` with `null` meaning unbounded.
  - Ranges: `today`, `yesterday` (both bounds = today−1), `week` (today−6 → today), `month` (today−29 → today), `year` (Jan 1 → today), `all` (both `null`).
  - New: `?from=YYYY-MM-DD&to=YYYY-MM-DD` for an exact window. Both must be present, both must be real dates (`isValidIsoDate` rejects `2026-02-31` and non-ISO strings), and `from <= to`; each violation is a **400**. `from`/`to` win over `range` if both are sent.
  - ⚠️ `manilaToday()` uses `Intl.DateTimeFormat(..., { timeZone: "Asia/Manila" }).formatToParts()` and rebuilds the string from the parts, **not** `en-CA` formatting — the part names are read explicitly so an ICU change can't silently alter the date format. Do the "compute the day in Manila in JS" trick in exactly one place; doing it per route is how the 8 AM rollover bug comes back.
- **`app/lib/dateFilter.ts`**: one source of truth for the filter keys, `buildOrdersQuery(filter, customRange)`, `describeRange()` ("this week", "2026-10-01 to 2026-10-05") and `rangeSlug()` for filenames. `buildOrdersQuery` returns **null** for a custom filter with no applied dates, and callers treat null as "don't fetch yet".
- **`app/ui/DateFilterBar.tsx`**: the chips + custom from/to panel, now used by **both** the sales report and the dashboard. The typed dates live inside this component while the applied window lives in the parent, so editing a field never refetches and switching chips back and forth keeps what was typed. ISO dates compare correctly with `>`, so validation needs no `Date`.
- **`StatsCard.tsx` (dashboard), rewritten.** Was three full-width `h-32` boxes in a `p-10` column, hardcoded to `?range=today`. Now: range chips, a responsive card grid (1 / 2 / 4 columns), and four cards — **Total Sales, Orders Processed, Low Stock Items, Best Seller** (was: Sales Today, Orders Processed, Low Stock). It keeps the **full ingredient list**, not just the low-stock count, which is what made the export possible. Best seller aggregates `order.items` by name (names are the only key in the response, and `menu_items.name` is not unique — fine for a ranking, wrong for identity).
- **`app/lib/csv.ts`**: `downloadCsv(filename, rows, columns)` + `toCsv`. No dependency. Prefixes a **UTF-8 BOM** so Excel doesn't render accented names as mojibake; quotes a cell only when it contains `"`, `,` or a newline, and doubles inner quotes; joins rows with `\r\n` (what Excel expects). The temp `<a>` and object URL are removed/revoked after the click.
- Export menu offers three files: **Sales & orders** (ref, time, date, status, item count, total), **Low stock** (every ingredient + a Yes/No low flag, not just the low ones — the owner needs the full picture to plan a restock run), **Best sellers** (rank, item, quantity, revenue). Filenames carry both the range slug and a Manila timestamp so exports don't overwrite each other.
- **Honest limitation**: the best-sellers revenue column is `quantity × unitPrice`, so it **excludes add-ons** (charged at the order level). It's a floor. The per-order Total in the sales CSV is exact.
- **Low stock is a current snapshot, not range-scoped** — there is no stock history in the schema, so that card and CSV always reflect right now. Sales, processed orders and best seller follow the selected range.

**Step 13: `completed` status — ✅ CODE BUILT, ⚠️ NEEDS SQL IN NEON FIRST**
- **Run this in Neon before testing**, or the PATCH will fail on the CHECK constraint:
  ```sql
  ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'preparing', 'ready', 'completed'));
  ```
  Postgres auto-named the original column CHECK `orders_status_check`; confirm with `SELECT conname FROM pg_constraint WHERE conrelid = 'orders'::regclass AND contype = 'c';` if the DROP fails.
- **Deliberately a status, not a DELETE.** An order row *is* the sales history — `orders`, `order_items` and `order_item_addons` are what every report reads. Deleting completed orders would erase the day's revenue. The status only controls what the barista board shows.
- This also **closes the old open question** ("no cancel for baristas; an order the customer never collects stays `ready` forever"). Completed is the barista's "handed over" signal, and such an order leaves the board.
- Flow: pending → preparing → ready → **completed**. On a `ready` order the detail modal now shows a prominent green **Mark as Completed** above **Move Back to Preparing**; completing releases the card to the next order, exactly like "Mark as Ready" does.
- **Completed orders are filtered in `Dashboard.tsx`'s `fetchOrders`**, once, so the counts, the queue, the focused card and the row list all exclude them without four separate filters. The badge reads "N active". `/order-queue` needed no change: it filters explicitly for `preparing`/`ready`, so collected orders vanish off the customer board for free.
- `StatsCard`'s **Orders Processed now counts `completed`**, not `ready` — crediting drinks that were made but never collected was the old behaviour.
- The barista status-update failure was an `alert()`; it's now an inline `actionError` banner (**the last native dialog in the app**).
- `VALID_STATUSES` in `app/api/orders/[id]/route.ts` and the `?status=` whitelist in `app/api/orders/route.ts` both had to learn the new value, plus `OrderSummary["status"]` in `types.ts` and the CHECK in `latest_schema.sql`. Four places, one list — a new status means editing all four.
- *Not verified end-to-end.* Completing an order is untested against the real constraint.

**Step 14: customer-facing low-stock / unavailable badges — ✅ BUILT (needs a live test)**
- **Red "Unavailable" / orange "Low stock" on the customer menu, and unavailable items can no longer be ordered.** The row is still kept; only the menu hides it.
- `GET /api/menu` gained a third mode, `?unavailable=true`, and every item now carries **`isLowStock`** (added to `MenuRow` and `MenuItem` in `types.ts`):
  - `?all=true` — owner view, includes unavailable.
  - `?unavailable=true` — customer view that **also** includes unavailable items, so a drink the owner switched off shows as red instead of silently disappearing.
  - no params — available only (unchanged default).
  - ⚠️ The two views are now *distinguishable in content*, not just in filtering. If you ever want unavailable items hidden again, drop the param from `app/page.tsx` — do **not** change the default, because the owner page relies on `?all=true` and the default is what keeps the plain customer fetch honest.
- **`isLowStock` SQL**: `EXISTS (SELECT 1 FROM recipes r JOIN ingredients ing ON ing.id = r.ingredient_id WHERE r.menu_item_id = mi.id AND ing.stock_qty <= ing.restock_threshold)`. One low ingredient flags the whole item. Two known limits: a **size-specific** recipe row can flag an item as low for one size only (no per-size granularity), and an item with **no recipe rows is never low** (nothing to be short of). Same expression is duplicated in `/api/menu` and `/api/menu/[itemId]` — keep them in sync or a badge will differ between the grid and the item page.
- **Low stock is a warning, never a block.** The order API already refuses a genuine shortage with a 409 naming the ingredient, so blocking at "at threshold" would hide sellable drinks and lose sales.
- **`POST /api/orders` now re-checks `is_available` inside the transaction** (the price lookup joins `menu_items`). This was a real hole: the UI blocked unavailable items, but a cart left open while the owner switched an item off would still have submitted it. Throws `Unavailable: <name>`, caught alongside the stock message and returned as a **409** the customer can read. Never trust a cart that sat open.
- `ProductCard` renders a non-`Link` `<div>` for unavailable items, so there is no href to follow even by keyboard; the image goes grayscale and the name is struck through. Low stock renders the orange badge above the price.
- `/orders/[itemId]` shows a read-only page with a red "Unavailable" pill and **no** `AddToOrderButton`, plus an orange low-stock note. `/api/menu/[itemId]` still 404s unavailable items — the page is convenience, the server is the guard.
- *Untested.* Nothing has confirmed the `EXISTS` subquery against real recipes, nor that a stale cart produces the 409.

**Step 15: menu item image upload — ✅ BUILT (needs a live test)**
- **Decision: images are stored in the database, not on disk or a CDN.** `menu_items.image_url` already being `TEXT` is what makes this possible — a data URL is ~40KB of text. Chosen because it needs no account, no keys and no hosting, and works on any host. *If the menu ever grows past a few dozen photos, revisit this* — every `/api/menu` response carries the bytes inline, and a CDN would be the fix.
- **Verify the column type in Neon** (the schema file says TEXT, but confirm):
  ```sql
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'menu_items' AND column_name = 'image_url';
  ```
  If it comes back `character varying`, run `ALTER TABLE menu_items ALTER COLUMN image_url TYPE TEXT;` — otherwise a data URL silently fails to insert (or truncates at 255 chars).
- **`app/lib/imageUpload.ts`**: `fileToDataUrl()` resizes the picked file **in the browser** on a canvas to 600px longest edge, encodes WebP at 0.8 (falling back to JPEG, detected by checking the returned data URL prefix rather than assuming), and returns the data URL. A phone photo goes from 3–8 MB to ~40 KB, so neither the request nor the row is bloated. Also `isDataUrl()` and `slugifyImageName()`.
- **`app/lib/imageValue.ts`**: `validateImageValue()`, the **server-side** guard, used by both `POST /api/menu` and `PATCH /api/menu/[id]`. Accepts only a data URL (length-capped at `MAX_DATA_URL_CHARS`), an `http(s)` URL, or a `/public` path. It lives in `lib`, not in a route file, because route modules shouldn't be imported into each other. This is what rejects a pasted OS path like `C:\pics\latte.jpg` — storable but unrenderable.
- **`app/ui/ImagePicker.tsx`**: the dashed preview box *is* the file-picker target, plus the original text field and a Remove button. It resets `inputRef.value` after each pick, otherwise selecting the same file twice in a row fires no change event.
- **`app/ui/ItemImage.tsx`**: renders `next/image` for paths/URLs but a plain `<img>` for data URLs, since the optimizer can't fetch and resize base64. Used by `ProductCard`, `MenuItemCard`, `ItemHeader` and `OrderCard`. The `@next/next/no-img-element` rule is disabled at file level, not with `eslint-disable-next-line` — inline disables land on the wrong line inside JSX and produce an "unused directive" warning.
- **Image name**: `slugifyImageName("Kombi Cappuccino")` → `kombi_cappuccino.webp`, shown in the picker. ⚠️ It is a **label, not a path** — no file is written to disk, because the bytes are in the database. If storage ever moves to files, the intended filename is already decided.
- *Untested.* No upload has been run; the WebP fallback path and the 600px resize are unverified in a real browser.

## Open items / gaps
- **The whole order→deduct path is untested.** Recipes and deduction are built but never run against real data. Until it's verified, treat Phases 3–5 as "code complete, behaviour unconfirmed". The one-line check that matters most: a **failed** (409) order must not consume a `daily_number`.
- **No auth** on any owner route or page (NextAuth not implemented; `?all=true` and all mutations are open). Biggest structural risk left, and the reason this must be done **before any public deploy** — while it's on localhost it costs nothing to defer.
- **The `expires_at` column does not exist in Neon**, and no code references it. Nothing to clean up; just be aware the earlier session built and reverted that feature.
- **`idx_ingredients_name_unique` may not exist in Neon yet.** `POST /api/ingredients` uses `ON CONFLICT (LOWER(TRIM(name)))`, which **errors if the index is missing**. If adding a duplicate-named ingredient throws a 500 mentioning no matching constraint, run `CREATE UNIQUE INDEX idx_ingredients_name_unique ON ingredients (LOWER(TRIM(name)));`.
- `MenuItemCard` renders a raw `null` category; needs the "Uncategorized" fallback.
- `OrderPage` still fetches all of `/api/menu` instead of `/api/menu/[itemId]`.
- **One native dialog left**: none. ✅ Resolved — `app/ui/ConfirmModal.tsx` covers staff delete (both tables), menu item delete, ingredient delete, and the barista revert.
- **Ingredient Delete had no confirmation**: ✅ Resolved — it now uses `ConfirmModal` and shows the recipe-linked 409 as an inline banner.
- **`All Time` is unbounded**: `?range=all` sends every order with full items and add-ons in one response. Fine at café volume, but it's the query most likely to slow down as history grows. If it drags, the fix is a **server-side aggregate endpoint** (totals + per-item sums in SQL) rather than trimming the range — don't "fix" it by silently capping the range.
- **The reporting/export path is untested end-to-end.** Nothing has confirmed `?from=&to=` against real rows, that the custom panel refetches on Apply, or that the three CSVs open cleanly in Excel.
- **No CSV export on the sales report page** — the dashboard has one, the report doesn't. Same `csv.ts` helper, so it's cheap to add if wanted.
- **`best-sellers` revenue understates** by excluding add-ons (see Step 12). Fixing it properly means the API returning add-on prices per item, not a client-side calculation.
- Owner modals fetch categories/sizes inline on every open; could be cached.
- `SideNav.tsx` © 2025 → 2026.
- `orders/[itemId]/page.tsx` has an unused `setQuantity` (the one remaining lint warning) and types its local add-ons as `imgUrl: string` while the API's `AddOn.imgUrl` is nullable. Harmless (the `??` fallback covers it) but both are wrong.
- Consider whether Delete should be hidden in favor of "unavailable" for items with order history (currently it 409s with a message).
- Scaling: `?range=today` re-sends every order including all of day's `ready` ones, every 3s. Fine at café volume; if it drags, use `?status=pending` plus a second fetch for `preparing` rather than filtering a growing array client-side.

**Still to do in Phase 5**: image hosting migration for `menu_items`; add-on depletion (needs `add_ons.ingredient_id`, blocked on deciding where whipped cream lives).
- **Whipped cream is the awkward ingredient**: a spray canister can't be weighed, so its unit is `servings`, not g/ml. It may need to exist in *both* `ingredients` (as stock) and `add_ons` (as the priced toggle). Still unresolved.
- **Expiry tracking: not done, deliberately deferred** for now. See "Ingredient units decision" above for the reasoning.

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
- When a fix surfaces a genuine design decision, pause and reason through options with the user rather than picking silently. For design/tradeoff questions, give a clear recommendation with reasoning rather than a menu of options — **but ask first when the answer changes what gets built** (CSV vs PDF, range chips vs a custom picker), using the `question` tool, then build. Favor honesty over false precision.
- **CSS gotcha worth remembering**: `ml-auto` does nothing on a `flex` element that is only as wide as its content — auto margins eat *free space*, and a content-width flex container has none. To right-align inside a flex row the element must be full-width and use `justify-end` (`w-full justify-end`). This is why "Show password" sat on the left under the password field on both login pages.
- When the user pastes their own draft, check it line-by-line against names/types already agreed on before assuming the logic is wrong (many past errors were pure naming mismatches, e.g. `menuItemId` vs `itemId`). Name the two disagreeing identifiers.
- User sometimes pastes stale code from earlier in the chat. Ask whether it's the current file before diagnosing. **Also applies to repo snapshots and to this doc** — cross-check against the actual repo before acting.
- **The assistant has no database access.** It can read the repo and hand the user SQL to run in Neon, nothing more. Never imply otherwise, and never claim data was verified in the database. It also **cannot view images** — if the user pastes a screenshot, ask for the error text or a description instead.
- **Design lesson from this round**: two of the "bugs" reported this session were **affordance problems, not code problems** — a section buried at the bottom of a long modal, and a clickable card with no visual indication it was clickable. When a UI step is hard to find, consider whether it deserves its own entry point before assuming the styling is wrong.
- **Lesson worth keeping**: a "my data is gone" report is usually a *failing query*, not lost data — check the server/terminal error before assuming deletion. A `GET` route returning `{ error }` that a page stored as a list produced `ingredients.filter is not a function` and looked exactly like data loss.
- **When a feature needs a schema change**, land the SQL and the app code as separate steps, and make the app fail *legibly* (check `response.ok`) rather than rendering an empty list that mimics data loss.
- Apply big batches **one small testable group at a time**, and list what to test after each. Before moving on, confirm each earlier step was actually applied, since delivered ≠ applied.
- When the user pastes their own working version of a delivered function, compare behavior, keep theirs when equivalent, flag only real bugs, and warn against pasting a second copy (duplicate exports error).
