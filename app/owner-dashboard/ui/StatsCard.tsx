
'use client'

// Import React hooks
// useState = stores data that can change
// useEffect = runs code when the component loads
import { useEffect, useState } from "react";

// Import the Zustand store that contains order information

import { OrderSummary } from "@/app/lib/types";


// Component that displays statistics
function StatsCard() {

  // Get the orders from the BaristaStore
  //
  // state => state.orders means:
  // "Get the orders property from the store."
  
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  useEffect(() => {
    // response.ok is checked before parsing, otherwise an error object
    // would be stored as the orders list and .filter() would crash
    fetch('/api/orders?range=today')
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(console.error);
  }, []);
  

  // Stores the number of ingredients that are low in stock
  // The starting value is 0.
  const [lowStockItems, setLowStockItems] = useState(0);


  // Runs when the component first loads
  useEffect(() => {

    // Function used to get the ingredients
    // from the backend.
    async function fetchLowStock() {

      try {

        // Send a GET request to the ingredients API
        const response = await fetch('/api/ingredients');


        // Convert the response into JavaScript data
        //
        // We only need these two properties:
        // stockQty = current stock
        // restockThreshold = minimum stock level
        const data: {
          stockQty: number;
          restockThreshold: number
        }[] = await response.json();


        // Find ingredients where:
        //
        // current stock <= restock threshold
        //
        // Then count how many there are.
        setLowStockItems(
          data.filter(
            i => i.stockQty <= i.restockThreshold
          ).length
        );


      } catch (error) {

        // If the API request fails,
        // show the error in the console.
        console.error(
          "Failed to fetch ingredients for stats:",
          error
        );
      }
    }


    // Run the function
    fetchLowStock();

  }, []);
  // [] means this effect runs when the component loads.


  // ==========================================
  // ORDER PROCESSED
  // ==========================================

  // Filter the orders and keep only orders
  // whose status is "ready".
  //
  // .length tells us how many were found.
const processed = orders.filter(o => o.status === 'ready').length;


  // ==========================================
  // SALES
  // ==========================================

  // Add the total price of every order.
  //
  // acc = accumulated/running total
  // o = current order
  // o.totalPrice = price of the current order
  //
  // The 0 is the starting total.
const sales = orders.reduce((acc, o) => acc + o.total, 0);


  // ==========================================
  // DISPLAY THE CARDS
  // ==========================================

  return (
    <section>

      {/* Container for the three statistics */}
      <div className="flex flex-col p-10">


        {/* ======================================
            ORDER PROCESSED
            ====================================== */}

        <div className="h-32 bg-card-cream flex flex-col p-2 justify-center items-center mb-3">

          {/* Title */}
          <span className="font-bold text-2xl">
            ORDER PROCESSED
          </span>


          {/* 
            Display the number of processed orders.

            Example:
            processed = 5

            The screen will show:
            5
          */}
          <span className="font-semibold text-4xl">
            {processed}
          </span>

        </div>


        {/* ======================================
            SALES
            ====================================== */}

        <div className="h-32 bg-card-cream flex flex-col p-2 justify-center items-center mb-3">

          {/* Title */}
          <span className="font-bold text-2xl">
            SALES
          </span>


          {/* 
            Display the total sales.

            toFixed(2) makes sure there are
            always two decimal places.

            Example:
            500 -> ₱500.00
          */}
          <span className="font-semibold text-4xl">
            ₱{sales.toFixed(2)}
          </span>

        </div>


        {/* ======================================
            LOW STOCK ITEMS
            ====================================== */}

        <div className="h-32 bg-card-cream flex flex-col p-2 justify-center items-center mb-3">

          {/* Title */}
          <span className="font-bold text-2xl">
            LOW STOCKS ITEMS
          </span>


          {/* 
            Display the number of ingredients
            that are currently low in stock.

            Example:
            lowStockItems = 3

            The screen will show:
            3
          */}
          <span className="font-semibold text-4xl">
            {lowStockItems}
          </span>

        </div>


      </div>

    </section>
  );
}


// Make this component available
// for other files to import and use.
export default StatsCard;

