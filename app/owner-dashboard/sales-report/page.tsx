
'use client'
// This tells Next.js that this component runs on the client/browser.

import { useMemo, useState } from "react";
// useState = stores data that can change.
// useMemo = calculates something and remembers the result until its dependencies change.

import OwnerHeader from "../ui/OwnerHeader";
// Imports the header component used at the top of the page.

import { useBaristaStore } from "@/store/BaristaStore";
// Imports the Zustand store that contains the application's order data.


// This is the main Sales Report component.
export default function SalesReport() {

  // Stores which date filter the user selected.
  // The possible values are only "today", "week", or "month".
  // The default filter is "today".
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month">("today");


  // Gets the orders from the BaristaStore.
  // "orders" contains the orders currently stored in the application.
  const orders = useBaristaStore(state => state.orders);


  // Creates a new list containing only orders
  // that belong to the selected date range.
  const filteredOrders = useMemo(() => {

    // Gets the current date and time.
    const now = new Date();

    // Go through every order.
    return orders.filter((order) => {

      // Convert the order's timestamp into a JavaScript Date.
      const orderDate = new Date(order.timestamp);


      // If the user selected "today",
      // only keep orders whose date is the same as today.
      if (dateFilter === "today") {
        return orderDate.toDateString() === now.toDateString();
      }


      // If the user selected "week",
      // calculate the date from 7 days ago.
      if (dateFilter === "week") {

        // Create a copy of the current date.
        const weekAgo = new Date(now);

        // Move that date back by 7 days.
        weekAgo.setDate(now.getDate() - 7);

        // Keep orders from the last 7 days.
        return orderDate >= weekAgo;
      }


      // If the filter is "month",
      // calculate the date from 1 month ago.
      const monthAgo = new Date(now);

      // Move the date back by one month.
      monthAgo.setMonth(now.getMonth() - 1);

      // Keep orders from the last month.
      return orderDate >= monthAgo;

    });

  // Recalculate filteredOrders when either orders
  // or dateFilter changes.
  }, [orders, dateFilter]);


  // Add the totalPrice of every filtered order.
  //
  // Example:
  // Order 1 = ₱100
  // Order 2 = ₱150
  // Order 3 = ₱200
  //
  // totalSales = ₱450
  const totalSales = filteredOrders.reduce(
    (acc, o) => acc + o.totalPrice,
    0
  );


  // Counts how many orders are inside the selected date range.
  const totalOrders = filteredOrders.length;


  // Calculates the average amount spent per order.
  //
  // Example:
  // totalSales = ₱1,000
  // totalOrders = 10
  //
  // averageOrder = ₱100
  //
  // If there are no orders, return 0
  // to prevent division by zero.
  const averageOrder =
    totalOrders > 0 ? totalSales / totalOrders : 0;


  // Finds the item that was sold the most.
  const topSellingItem = useMemo(() => {

    // This object will store the total quantity sold
    // for each item.
    //
    // Example:
    // {
    //   "Latte": 10,
    //   "Americano": 7,
    //   "Cappuccino": 5
    // }
    const counts: Record<string, number> = {};


    // Go through every order in the selected date range.
    for (const order of filteredOrders) {

      // Go through every item inside that order.
      for (const item of order.items) {

        // Add the item's quantity to its existing count.
        //
        // ?? 0 means:
        // "If this item doesn't have a count yet, use 0."
        counts[item.name] =
          (counts[item.name] ?? 0) + item.quantity;
      }
    }


    // Convert the counts object into an array.
    //
    // Example:
    // {
    //   Latte: 10,
    //   Americano: 7
    // }
    //
    // becomes:
    // [
    //   ["Latte", 10],
    //   ["Americano", 7]
    // ]
    //
    // Then sort from highest quantity to lowest.
    const sorted = Object.entries(counts).sort(
      (a, b) => b[1] - a[1]
    );


    // Take the first item in the sorted list.
    //
    // [0]?.[0] means:
    // get the name of the first item if one exists.
    //
    // If there are no items, display "—".
    return sorted[0]?.[0] ?? "—";

  // Recalculate when filteredOrders changes.
  }, [filteredOrders]);


  // Make a copy of filteredOrders.
  //
  // We use [...filteredOrders] so that the original
  // filteredOrders array isn't directly modified.
  const recentOrders = [...filteredOrders]

    // Sort orders by timestamp.
    // Newest orders come first.
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    )

    // Only keep the first 5 orders.
    .slice(0, 5);


  // Everything below this is the page's user interface.
  return (
    <section className="min-h-screen bg-cream">

      {/* Page header */}
      <OwnerHeader title="SALES REPORT" />


      {/* Date filter buttons */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto">

          {/* 
            Creates the three buttons:
            Today
            This Week
            This Month
          */}
          {(["today", "week", "month"] as const).map((f) => (

            <button
              key={f}

              // Change the selected date filter
              // when the button is clicked.
              onClick={() => setDateFilter(f)}

              // Change the button appearance depending
              // on whether it is currently selected.
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                dateFilter === f
                  ? "bg-dark-brown text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >

              {/* Display a readable name for each filter. */}
              {f === "today"
                ? "Today"
                : f === "week"
                  ? "This Week"
                  : "This Month"}

            </button>
          ))}

        </div>
      </div>


      {/* Sales statistics */}
      <div className="px-4 mb-6 grid grid-cols-2 gap-3">


        {/* Total Sales */}
        <div className="bg-white rounded-lg p-4 shadow">

          <p className="text-xs text-gray-500 mb-1">
            Total Sales
          </p>

          {/* Displays total sales with 2 decimal places. */}
          <p className="text-2xl font-bold text-gray-900">
            ₱{totalSales.toFixed(2)}
          </p>

        </div>


        {/* Total Orders */}
        <div className="bg-white rounded-lg p-4 shadow">

          <p className="text-xs text-gray-500 mb-1">
            Total Orders
          </p>

          {/* Displays the number of orders. */}
          <p className="text-2xl font-bold text-gray-900">
            {totalOrders}
          </p>

        </div>


        {/* Average Order */}
        <div className="bg-white rounded-lg p-4 shadow">

          <p className="text-xs text-gray-500 mb-1">
            Average Order
          </p>

          {/* Displays the average order value. */}
          <p className="text-2xl font-bold text-gray-900">
            ₱{averageOrder.toFixed(2)}
          </p>

        </div>


        {/* Top Selling Item */}
        <div className="bg-white rounded-lg p-4 shadow">

          <p className="text-xs text-gray-500 mb-1">
            Top Selling
          </p>

          {/* Displays the item with the highest quantity sold. */}
          <p className="text-lg font-bold text-gray-900">
            {topSellingItem}
          </p>

        </div>

      </div>


      {/* Recent orders section */}
      <div className="px-4">

        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Recent Orders
        </h3>


        <div className="space-y-2">

          {/* 
            If there are no orders in the selected
            date range, display this message.
          */}
          {recentOrders.length === 0 && (
            <p className="text-sm text-gray-500">
              No orders in this range.
            </p>
          )}


          {/* Display the 5 most recent orders. */}
          {recentOrders.map((order) => (

            <div
              key={order.id}
              className="bg-white rounded-lg p-4 shadow flex items-center justify-between"
            >

              <div className="flex-1">

                {/* Displays the order reference number. */}
                <p className="font-semibold text-gray-900">
                  #{order.orderReference}
                </p>


                {/* Displays number of items and order time. */}
                <p className="text-sm text-gray-500">

                  {order.items.length} items ·{" "}

                  {new Date(order.timestamp).toLocaleTimeString(
                    'en-PH',
                    {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    }
                  )}

                </p>

              </div>


              {/* Displays the total price of the order. */}
              <p className="text-lg font-bold text-gray-900">
                ₱{order.totalPrice.toFixed(2)}
              </p>

            </div>

          ))}

        </div>
      </div>

    </section>
  );
}
