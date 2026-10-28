'use client'

// Customer menu page: fetches the full menu, lets the customer switch
// categories or search drinks by name. Searching shows every matching item
// across all categories, so a forgotten pick can be found even if the customer
// no longer remembers which section it was in. Today's best sellers surface at
// the top. Requires a table to be selected first; redirects to table-select
// otherwise.
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/ui/Header';
import BestSellers from '@/app/ui/BestSellers';
import CategoryBar from '@/app/ui/CategoryBar';
import MenuItem from '@/app/ui/MenuItem';
import ProductCard from '@/app/ui/ProductCard';
import ProductCardSkeleton from '@/app/ui/ProductCardSkeleton';
import SearchAutocomplete from '@/app/ui/SearchAutocomplete';
import ViewOrderBar from '@/app/ui/ViewOrderBar';
import ChangeTableModal from '@/app/ui/ChangeTableModal';
import { useTableStore } from '@/store/TableStore';
import { useOrderTypeStore } from '@/store/OrderTypeStore';
import type { MenuItem as MenuItemType } from "@/app/lib/types";
import { usePolling } from '@/app/lib/usePolling';

const SKELETON_COUNT = 8;

export default function Home() {
  const [active, setActive] = useState("All");
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const router = useRouter();
  const selectedTable = useTableStore(state => state.selectedTable);
  const orderType = useOrderTypeStore(state => state.orderType);

  // Redirect to table selection if no table is chosen (only for dine-in)
  useEffect(() => {
    if (orderType === 'dine_in' && selectedTable === null) {
      router.push('/table-select');
    }
  }, [selectedTable, orderType, router]);

  const fetchMenu = useCallback(async () => {
    try {
      const response = await fetch('/api/menu?unavailable=true', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      if (Array.isArray(data)) {
        // Filter out add-ons (type === 'addon') - they should only appear as customization options
        const menuOnly = data.filter((item: MenuItemType) => item.type !== 'addon');
        setMenuItems(menuOnly);
      }
    } catch (error) {
      console.error("Failed to fetch menu:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchMenu, 2000);

  // Search is category-independent: a match in any section counts, so the bar
  // is the only thing that changes the displayed grid
  const searchedItems = search
    ? menuItems.filter((item) =>
        item.itemName.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  if (loading || (orderType === 'dine_in' && selectedTable === null)) {
    return (
      <div className="min-h-screen bg-cream relative pb-28">
        <Header />

        {/* Table indicator bar */}
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-roboto-condensed tracking-wide text-amber-900">
            {orderType === 'takeout' ? 'Takeout' : `TABLE ${selectedTable ?? '—'}`}
          </span>
        </div>

        <h2 className='font-roboto-slab text-2xl text-center mb-1 flex items-center justify-center'>
          MENU
        </h2>

        <div className="px-4 mb-3">
          <SearchAutocomplete
            menuItems={[]}
            onSearch={() => {}}
            placeholder="Loading..."
          />
        </div>

        <BestSellers menuItems={[]} />

        <CategoryBar active={active} setActive={setActive} />

        <hr className='mb-3' />

        {/* Skeleton grid */}
        <div className="px-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>

        <ViewOrderBar />
      </div>
    );
  }

  const searching = search.trim().length > 0;
  const isAllCategory = active === "All";

  // Prepare search suggestions data
  const searchSuggestionsData = menuItems.map(item => ({
    itemName: item.itemName,
    category: item.category,
  }));

  return (
    <div className='bg-cream min-h-screen relative pb-28'>
      <Header />

      {/* Table indicator bar */}
      <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-roboto-condensed tracking-wide text-amber-900">
          {orderType === 'takeout' ? 'Takeout' : `TABLE ${selectedTable}`}
        </span>
        {orderType !== 'takeout' && (
          <button
            onClick={() => setTableModalOpen(true)}
            className="text-sm text-amber-900 hover:underline cursor-pointer min-h-[44px] min-w-[44px] flex items-center"
          >
            Change table
          </button>
        )}
      </div>

      <ChangeTableModal
        isOpen={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
      />

      <h2 className='font-roboto-slab text-2xl text-center mb-1 flex items-center justify-center'>
        MENU
      </h2>

      <div className="px-4 mb-3">
        <SearchAutocomplete
          menuItems={searchSuggestionsData}
          onSearch={setSearch}
          placeholder="Search drinks..."
        />
        {searching && searchedItems.length === 0 && (
          <p className="text-sm text-dark-brown/60 mt-2 text-center">No drinks found.</p>
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
         <div className="px-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
           {searchedItems.length > 0 ? (
            searchedItems.map((item) => (
              <ProductCard key={item.uniqueKey} item={item} />
            ))
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center py-12 text-dark-brown/50">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="8" strokeWidth="1.5" />
                <path d="M21 21l-4.35-4.35" strokeWidth="1.5" />
              </svg>
              <p className="text-lg font-roboto-slab">No drinks found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      <ViewOrderBar />
    </div>
  );
}