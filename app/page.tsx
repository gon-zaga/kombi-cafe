'use client'

// Customer menu page: fetches the full menu, lets the customer switch
// categories or search drinks by name. Searching shows every matching item
// across all categories, so a forgotten pick can be found even if the customer
// no longer remembers which section it was in. Today's best sellers surface at
// the top. Requires a table to be selected first; redirects to table-select
// otherwise.
import './globals.css'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/ui/Header';
import BestSellers from '@/app/ui/BestSellers';
import CategoryBar from './ui/CategoryBar';
import MenuItem from './ui/MenuItem';
import ProductCard from './ui/ProductCard';
import ViewOrderBar from './ui/ViewOrderBar';
import { useTableStore } from '@/store/TableStore';
import type { MenuItem as MenuItemType } from "@/app/lib/types";

export default function Home() {
  const [active, setActive] = useState("All");
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const selectedTable = useTableStore(state => state.selectedTable);

  // Redirect to table selection if no table is chosen
  useEffect(() => {
    if (selectedTable === null) {
      router.push('/table-select');
    }
  }, [selectedTable, router]);

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

  if (loading || selectedTable === null) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-8">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-spin" />
          <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin" />
          <div className="absolute inset-2 border-4 border-amber-100 rounded-full border-b-transparent animate-spin reverse" style={{ animationDuration: '1.5s' }} />
        </div>
        <p className="text-dark-brown font-roboto-slab text-xl font-medium">Loading menu...</p>
      </div>
    );
  }

  const searching = search.trim().length > 0;

  return (
    <div className='bg-cream min-h-screen'>
      <Header />

      {/* Table indicator bar */}
      <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-roboto-condensed tracking-wide text-amber-900">
          TABLE {selectedTable}
        </span>
        <button
          onClick={() => router.push('/table-select')}
          className="text-xs text-amber-900 hover:underline"
        >
          Change table
        </button>
      </div>

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
