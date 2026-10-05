'use client'

// Customer menu page: fetches the full menu, lets the customer switch
// categories or search drinks by name. Searching shows every matching item
// across all categories, so a forgotten pick can be found even if the customer
// no longer remembers which section it was in. Today's best sellers surface at
// the top.
import './globals.css'
import { useEffect, useState } from 'react';
import Header from '@/app/ui/Header';
import BestSellers from '@/app/ui/BestSellers';
import CategoryBar from './ui/CategoryBar';
import MenuItem from './ui/MenuItem';
import ProductCard from './ui/ProductCard';
import ViewOrderBar from './ui/ViewOrderBar';
import type { MenuItem as MenuItemType } from "@/app/lib/types";

export default function Home() {
  const [active, setActive] = useState("All");
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchMenu() {
      try {
        // ?unavailable=true so items the owner switched off are still listed, marked
        // Unavailable, instead of vanishing from the menu
        const response = await fetch('/api/menu?unavailable=true');
        const data = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error("Failed to fetch menu:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, []);

  // Search is category-independent: a match in any section counts, so the bar
  // is the only thing that changes the displayed grid
  const searchedItems = search
    ? menuItems.filter((item) =>
        item.itemName.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  if (loading) {
    return <p className="text-center py-10">Loading menu...</p>;
  }

  const searching = search.trim().length > 0;

  return (
    <div className='bg-cream min-h-screen'>
      <Header />

      <h2 className='font-roboto-slab text-2xl text-center mb-1 flex items-center justify-center'>
        MENU
      </h2>

      <div className="px-4 mb-3">
        <input
          type="text"
          placeholder="Search drinks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-dark-brown/30 rounded-xl px-3 py-2 font-roboto-mono text-dark-brown focus:outline-none focus:ring-2 focus:ring-amber-800/30 placeholder:text-dark-brown/50"
          aria-label="Search drinks"
        />
        {searching && searchedItems.length === 0 && (
          <p className="text-sm text-dark-brown/60 mt-2">No drinks found.</p>
        )}
      </div>

      <BestSellers menuItems={menuItems} />

      {/* The category bar and active label only matter while browsing; hide them
          while a search is active so the grid gets the whole viewport */}
      {!searching && <CategoryBar active={active} setActive={setActive} />}
      {!searching && (
        <div className="h-12 flex justify-center items-center font-bold text-dark-brown">
          {active}
        </div>
      )}

      <hr className='mb-3' />

      {/* MenuItem renders the category-filtered grid; the search
          results mirror its grid shape, so toggling search never relayouts */}
      {!searching ? (
        <MenuItem active={active} menuItems={menuItems} />
      ) : (
        <div className="px-5 grid grid-cols-2 gap-4">
          {searchedItems.map((item) => (
            <ProductCard
              key={item.itemId}
              item={item}
            />
          ))}
        </div>
      )}

      <ViewOrderBar />
    </div>
  );
}
