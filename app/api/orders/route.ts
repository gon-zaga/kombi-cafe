// Handles order submission: creates an order + its items/add-ons from a client-submitted cart,
// with prices re-looked-up server-side (never trusted from the client) and the whole
// insert sequence run as one transaction so a failure partway rolls everything back
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

// Defining the expected structure of the incoming request
interface PlaceOrderPayload {
  items: {
    itemId: number;
    sizeId: number;
    quantity: number;
    addOnIds: number[];
  }[];
}

export async function POST(request: Request) {
  try {
    const body: PlaceOrderPayload = await request.json();

    // validation
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain atleast one item" },
        { status: 400 }
      );
    }

    // Check out a single client so every query below runs on the same
    // connection — required for BEGIN/COMMIT/ROLLBACK to actually work together
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // step 1: atomically bump today's daily_counters row (or create it if this
      // is the first order today), and get back the number this order should use
      const dailyNumberResult = await client.query(`
        INSERT INTO daily_counters (order_date, last_number)
        VALUES (CURRENT_DATE, 1)
        ON CONFLICT (order_date)
        DO UPDATE SET last_number = daily_counters.last_number + 1
        RETURNING last_number;        
        `);

      const dailyNumber = dailyNumberResult.rows[0].last_number;

      // step 2: insert the orders row itself. total starts at 0 as a placeholder —
      // we don't know the real total until every item/add-on below is priced
      const orderResult = await client.query(
        `
          INSERT INTO orders (daily_number, order_date, total, status)
          VALUES ($1, CURRENT_DATE, 0, 'pending')
          RETURNING id;
          `,
        [dailyNumber]
      );

      const orderId = orderResult.rows[0].id;

      let runningTotal = 0;

      // step 3 + 4: for each cart item, re-look-up its real price, insert its
      // order_items row, then loop its add-ons and do the same for each of those
      for (const item of body.items) {
        // Re-look-up the current price for this item+size — never trust a price
        // sent from the client, since menu prices can change after the client fetched them
        const priceResult = await client.query(
          `SELECT price FROM menu_item_sizes WHERE menu_item_id = $1 AND size_id = $2;`,
          [item.itemId, item.sizeId]
        );

        if (priceResult.rows.length === 0) {
          throw new Error(`No price found for itemId ${item.itemId}, sizeId ${item.sizeId}`);
        }

        const unitPrice = Number(priceResult.rows[0].price);
        runningTotal += unitPrice * item.quantity;

        // step 3: insert this cart line as an order_items row, snapshotting unitPrice
        // so this order stays accurate even if the menu price changes later
        const orderItemResult = await client.query(
          `
          INSERT INTO order_items (order_id, menu_item_id, size_id, quantity, unit_price)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
          `,
          [orderId, item.itemId, item.sizeId, item.quantity, unitPrice]
        );

        const orderItemId = orderItemResult.rows[0].id;

        // step 4: insert one order_item_addons row per add-on selected on this item
        for (const addOnId of item.addOnIds) {
          const addOnPriceResult = await client.query(
            `SELECT price FROM add_ons WHERE id = $1;`,
            [addOnId]
          );

          if (addOnPriceResult.rows.length === 0) {
            throw new Error(`No add-on found for id ${addOnId}`);
          }

          const addOnPrice = Number(addOnPriceResult.rows[0].price);
          runningTotal += addOnPrice * item.quantity;

          await client.query(
            `
            INSERT INTO order_item_addons (order_item_id, add_on_id, quantity, price)
            VALUES ($1, $2, $3, $4);
            `,
            [orderItemId, addOnId, 1, addOnPrice]
          );
        }
      }

      // Now that every item/add-on has been priced, go back and set the real total
      await client.query(
        `UPDATE orders SET total = $1 WHERE id = $2;`,
        [runningTotal, orderId]
      );

      await client.query('COMMIT');

      // Format daily_number the same way the rest of the app displays reference numbers (e.g. 0001)
      const orderReference = String(dailyNumber).padStart(4, '0');

      return NextResponse.json(
        { message: "Order placed successfully", orderReference, total: runningTotal },
        { status: 201 }
      );
    } catch (error) {
      // Something failed partway through the insert sequence — undo everything
      // that happened after BEGIN so no half-finished order survives
      await client.query('ROLLBACK');
      console.error("Failed to place order:", error);
      return NextResponse.json(
        { error: "Failed to place order" },
        { status: 500 }
      );
    } finally {
      // Always return the connection to the pool, whether we succeeded or failed
      client.release();
    }
  } catch (error) {
    // Catches request.json() failures (malformed JSON body) or anything else
    // that goes wrong before we even reach the database
    console.error("Failed to process order request:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 500 }
    );
  }
}