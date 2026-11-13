# Kombi Books: Build Plan

Offline bookkeeping app. Pulls completed orders from Kombi's REST API over the LAN, stores them in its own SQLite file, adds manual expenses, reports income / expenses / profit (cash vs GCash).

Integration method: API/Web Service.

## 1. Scope

In:
- Sync completed orders from Kombi (date range, API key)
- Income entries with payment method (cash / GCash)
- Manual expense entry
- Monthly summary: income, expenses, net profit, cash vs GCash split
- CSV export of summary and ledger
- Duplicate protection by Kombi order id

Out (do not build): double-entry bookkeeping, tax, multi-user roles, bank reconciliation, refunds, inventory.

## 2. Architecture

```
Kombi (Next.js, :3000, Postgres)
   GET /api/integration/orders   [x-api-key]
        ^
        | HTTP over LAN, JSON
        |
Kombi Books (Next.js, :3001, SQLite file)
   server-side sync route -> SQLite -> pages
```

- Separate repo/folder, separate port, separate database (SQLite). Nothing touches Kombi's Postgres.
- Kombi Books calls Kombi from its own server code (API route), so no CORS and the API key never reaches the browser.
- Kombi down = Kombi Books still opens and shows previously synced data.

## 3. Changes in Kombi (do first)

The dashboards call `GET /api/orders` without a key, so do not lock that route. Add a separate keyed route.

3.1 `.env.local` (Kombi)
```
INTEGRATION_API_KEY=<long random string>
JWT_SECRET=<long random string>
```
Set a real `JWT_SECRET` too; the code falls back to a hardcoded default.

3.2 New file `app/api/integration/orders/route.ts`
```ts
// Keyed read-only orders feed for Kombi Books: checks x-api-key, reuses GET /api/orders, strips GCash photos
import { NextResponse } from "next/server";
import { GET as getOrders } from "@/app/api/orders/route";

export async function GET(request: Request) {
  const key = request.headers.get("x-api-key");
  if (!process.env.INTEGRATION_API_KEY || key !== process.env.INTEGRATION_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Force completed only so pending/unpaid orders are never booked as income
  const url = new URL(request.url);
  url.searchParams.set("status", "completed");
  const res = await getOrders(new Request(url, request));
  if (!res.ok) return res;

  const orders = await res.json();
  // gcash_photo is large base64 and not needed for bookkeeping
  const slim = orders.map(({ gcashPhoto, ...rest }: Record<string, unknown>) => rest);
  return NextResponse.json(slim);
}
```
Notes:
- `from`/`to` (YYYY-MM-DD) or `range` are passed through to the existing handler.
- Compare keys with `crypto.timingSafeEqual` if you want to be thorough.
- Response fields used by Books: `id`, `orderReference`, `total`, `paymentMethod`, `gcashReference`, `createdAt`, `completedAt`, `orderType`, `tableNumber`, `items`.

3.3 Test with PowerShell
```powershell
# No key -> 401; with key -> JSON array
Invoke-RestMethod "http://localhost:3000/api/integration/orders?range=today"
Invoke-RestMethod "http://localhost:3000/api/integration/orders?range=today" -Headers @{ "x-api-key" = "YOUR_KEY" }
```

3.4 LAN access: run Kombi with `next dev -H 0.0.0.0` (or `next start -H 0.0.0.0`), allow port 3000 in Windows Firewall, and use the host's LAN IP.

## 4. Kombi Books setup

```
npx create-next-app@latest kombi-books   (TypeScript, App Router, Tailwind)
npm i better-sqlite3
npm i -D @types/better-sqlite3
```
`.env.local` (Books)
```
KOMBI_BASE_URL=http://192.168.x.x:3000
KOMBI_API_KEY=<same key as Kombi>
```
If `better-sqlite3` fails to build on Windows, use `sql.js` or a JSON file store instead; the schema below still applies.

Folder layout
```
app/
  page.tsx                 dashboard (summary)
  income/page.tsx         ledger of synced orders
  expenses/page.tsx       add/list expenses
  report/page.tsx         monthly report + export
  api/sync/route.ts       POST: pull from Kombi, upsert
  api/expenses/route.ts   GET, POST, DELETE
  api/report/route.ts     GET: monthly totals
lib/
  db.ts                   SQLite connection + schema init
  kombi.ts                fetch wrapper for Kombi API
  csv.ts                  CSV builder (BOM, quoting)
data/books.sqlite         created at first run (gitignore)
```

## 5. Database schema (SQLite)

```sql
-- Income: one row per synced Kombi order; kombi_order_id UNIQUE gives duplicate protection
CREATE TABLE IF NOT EXISTS income (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kombi_order_id INTEGER NOT NULL UNIQUE,
  order_ref TEXT NOT NULL,
  order_date TEXT NOT NULL,            -- YYYY-MM-DD, Manila date of completion
  amount REAL NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('counter','gcash')),
  gcash_reference TEXT,
  order_type TEXT,
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_income_date ON income (order_date);

-- Expenses: entered manually
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_date TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ingredients','rent','utilities','salaries','supplies','other')),
  amount REAL NOT NULL CHECK (amount > 0),
  paid_via TEXT NOT NULL CHECK (paid_via IN ('cash','gcash')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (expense_date);

-- Sync log: shows when and how much each sync pulled (useful for the demo)
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  range_from TEXT, range_to TEXT,
  fetched INTEGER, inserted INTEGER, skipped INTEGER,
  status TEXT, message TEXT,
  ran_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Core logic

6.1 `lib/kombi.ts`: `fetchCompletedOrders(from, to)`
- GET `${KOMBI_BASE_URL}/api/integration/orders?from=&to=` with `x-api-key`.
- 5 to 10 s timeout (`AbortSignal.timeout`). On network error, return a readable message ("Kombi is unreachable at <url>").
- 401 -> "API key rejected". Non-array body -> error.

6.2 `POST /api/sync` body `{ from, to }`
1. Validate dates (both present, from <= to).
2. Fetch orders.
3. In one SQLite transaction, `INSERT ... ON CONFLICT(kombi_order_id) DO NOTHING` per order.
   - `order_date` = Manila date of `completedAt ?? createdAt` (compute with `Intl.DateTimeFormat` and `timeZone: "Asia/Manila"`, same approach as Kombi).
   - `amount` = `total`; `payment_method` = `paymentMethod ?? 'counter'`.
4. Count inserted vs skipped (`changes`), write `sync_log`, return `{ fetched, inserted, skipped }`.

Known limits to state honestly:
- Kombi filters by `order_date` (creation day), so an order created before midnight and completed after can fall in a different day than its completion date. Books books it on the completion date.
- Orders deleted in Kombi after sync stay in Books. Provide a "Remove entry" button or document it.

6.3 `GET /api/report?month=YYYY-MM`
```sql
-- Monthly totals split by payment method
SELECT payment_method, COUNT(*) AS orders, SUM(amount) AS total
FROM income WHERE substr(order_date,1,7) = ? GROUP BY payment_method;

-- Monthly expenses by category
SELECT category, SUM(amount) AS total
FROM expenses WHERE substr(expense_date,1,7) = ? GROUP BY category;
```
Net profit = total income - total expenses. Also return per-day income for a simple chart.

6.4 `lib/csv.ts`: UTF-8 BOM, quote cells containing `"`, `,` or newline, `\r\n` line endings (same rules as Kombi's old helper).

## 7. Pages

| Page | Content |
|---|---|
| Dashboard | Month picker; cards: Income, Expenses, Net Profit, Cash vs GCash; "Sync sales" button with date range; last sync status |
| Income | Table of synced orders (ref, date, method, amount); filter by month and method; remove entry |
| Expenses | Form (date, category, amount, paid via, note) + table with delete (confirm) |
| Report | Monthly summary table, expense breakdown by category, Export CSV |

Keep the styling consistent with Kombi (dark brown `#3D2B1F`, cream `#FAF3E0`) so it reads as the same family.

## 8. Build order (checkpoints)

| Phase | Work | Done when |
|---|---|---|
| 1 | Kombi: `INTEGRATION_API_KEY`, `/api/integration/orders`, LAN test | 401 without key, JSON with key, from a second device |
| 2 | Books: scaffold, `db.ts`, schema auto-create | `books.sqlite` appears, tables exist |
| 3 | `kombi.ts` + `POST /api/sync` | Sync inserts rows; second sync inserts 0, skips N |
| 4 | Income page + Sync button UI | Orders visible, errors shown when Kombi is off |
| 5 | Expenses CRUD | Add/delete works, validation rejects amount <= 0 |
| 6 | Report API + Dashboard + Report page | Totals match a hand calculation |
| 7 | CSV export, sync_log view | File opens cleanly in Excel |
| 8 | Polish, README, demo data, paper screenshots | Demo script runs start to finish |

Build and test one phase at a time; confirm each before moving on.

## 9. Test checklist

- Wrong or missing API key -> Books shows "API key rejected"; Kombi returns 401.
- Kombi stopped -> sync fails with a clear message; existing data still visible.
- Sync same range twice -> second run inserts 0.
- Place cash order and GCash order in Kombi, complete both, sync -> two income rows with correct methods.
- Pending/preparing/ready orders are not synced.
- Sum of synced amounts for a day equals Kombi's Sales Report total for the same day.
- Expense with negative or zero amount rejected.
- Month with no data shows zeros, not errors.
- Run Books from another laptop on the LAN against Kombi's IP.

## 10. Security notes

- API key only in server-side env; never in client code or git (`.env*` and `data/` in `.gitignore`).
- Integration route is read-only and omits `gcashPhoto`.
- Books has no login by default. If the demo machine is shared, add a single owner password (env var + signed cookie) or keep it on the owner's device only.
- Kombi's other `/api/*` owner routes remain unauthenticated; this is a known project-wide gap and out of scope here.

## 11. Demo script (5 min)

1. Show Kombi: place a cash order and a GCash order, barista completes both.
2. Show Kombi Books dashboard (empty or older data).
3. Click Sync -> "2 fetched, 2 inserted, 0 skipped".
4. Sync again -> "0 inserted, 2 skipped" (duplicate protection).
5. Add two expenses (ingredients, utilities).
6. Show monthly report: income, expenses, net profit, cash vs GCash.
7. Export CSV and open it.
8. Stop Kombi, click Sync -> readable error, data still shown.

## 12. Paper wording

Integration method: API/Web Service.

Partner system: Kombi Books, an offline bookkeeping and expense tracking application. It retrieves completed-order data from Kombi's REST API over the local network using an API key, stores it in its own SQLite database, combines it with manually entered expenses, and reports income, expenses, and net profit by payment method. No internet connection or paid software is required.

Limitations: synchronization is on demand (not real time); orders deleted in Kombi after a sync are not removed from Kombi Books; no double-entry accounting or tax computation.

## 13. Optional extras (only after everything above works)

- CSV import fallback for when the two apps are not on the same network (File Transfer).
- Auto-sync timer (every N minutes while the page is open).
- Daily cash count vs recorded cash income.
- Cost of goods from ingredient purchase expenses.
