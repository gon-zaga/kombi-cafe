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
      <div className="min-h-screen bg-cream relative overflow-hidden pb-28">
        {/* Paint smudge background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-2/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#8B4513]/15 blur-[60px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-2/3 right-1/4 w-[380px] h-[380px] rounded-full bg-[#D2691E]/18 blur-[60px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-[#CD853F]/15 blur-[50px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-1/4 right-1/3 w-[320px] h-[320px] rounded-full bg-[#DEB887]/18 blur-[50px] -translate-x-1/2 -translate-y-1/2" />
        </div>

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

  // Base smudges - always visible, positioned behind the MenuItem grid area only
  const baseSmudges = (
    <>
      <div className="absolute top-2/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#8B4513]/15 blur-[60px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-2/3 right-1/4 w-[380px] h-[380px] rounded-full bg-[#D2691E]/18 blur-[60px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-[#CD853F]/15 blur-[50px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/3 w-[320px] h-[320px] rounded-full bg-[#DEB887]/18 blur-[50px] -translate-x-1/2 -translate-y-1/2" />
    </>
  );

  // Extra smudges - only when "All" category is selected
  const extraSmudges = isAllCategory && !searching ? (
    <>
      {/* Medium smudges behind cards */}
      <div className="absolute top-3/4 left-1/2 w-[300px] h-[300px] rounded-full bg-[#8B4513]/14 -translate-x-1/2 -translate-y-1/2 blur-[50px]" />
      <div className="absolute top-4/5 right-1/2 w-[280px] h-[280px] rounded-full bg-[#D2691E]/16 -translate-x-1/2 -translate-y-1/2 blur-[50px]" />
      <div className="absolute top-5/6 right-1/2 w-[260px] h-[260px] rounded-full bg-[#CD853F]/14 -translate-x-1/2 -translate-y-1/2 blur-[50px]" />
      {/* Center smudges behind card grid */}
      <div className="absolute top-3/4 left-1/2 w-[240px] h-[240px] rounded-full bg-[#8B4513]/12 -translate-x-1/2 blur-[40px]" />
      <div className="absolute top-4/5 left-1/2 w-[220px] h-[220px] rounded-full bg-[#D2691E]/14 -translate-x-1/2 -translate-y-1/2 blur-[40px]" />
      <div className="absolute top-5/6 left-1/3 w-[200px] h-[200px] rounded-full bg-[#CD853F]/12 -translate-y-1/2 blur-[40px]" />
      <div className="absolute top-5/6 right-1/3 w-[200px] h-[200px] rounded-full bg-[#DEB887]/14 -translate-y-1/2 blur-[40px]" />
      {/* Additional smudges in the card grid area */}
      <div className="absolute top-3/4 left-1/4 w-[180px] h-[180px] rounded-full bg-[#8B4513]/11 -translate-x-1/2 -translate-y-1/2 blur-[30px]" />
      <div className="absolute top-3/4 right-1/4 w-[180px] h-[180px] rounded-full bg-[#D2691E]/13 -translate-x-1/2 -translate-y-1/2 blur-[30px]" />
      <div className="absolute top-4/5 left-1/4 w-[160px] h-[160px] rounded-full bg-[#CD853F]/11 -translate-x-1/2 blur-[30px]" />
      <div className="absolute top-4/5 right-1/4 w-[160px] h-[160px] rounded-full bg-[#DEB887]/13 -translate-x-1/2 blur-[30px]" />
      {/* Extra smudges - denser coverage */}
      <div className="absolute top-4/5 left-1/6 w-[200px] h-[200px] rounded-full bg-[#8B4513]/11 -translate-x-1/2 blur-[40px]" />
      <div className="absolute top-4/5 right-1/6 w-[200px] h-[200px] rounded-full bg-[#D2691E]/13 -translate-x-1/2 blur-[40px]" />
      <div className="absolute top-5/6 left-1/4 w-[180px] h-[180px] rounded-full bg-[#CD853F]/11 -translate-x-1/2 blur-[40px]" />
      <div className="absolute top-5/6 right-1/4 w-[180px] h-[180px] rounded-full bg-[#DEB887]/13 -translate-x-1/2 blur-[40px]" />
      {/* More smudges for richer texture when All category */}
      <div className="absolute top-3/4 left-1/6 w-[180px] h-[180px] rounded-full bg-[#8B4513]/10 -translate-x-1/2 -translate-y-1/2 blur-[35px]" />
      <div className="absolute top-3/4 right-1/6 w-[180px] h-[180px] rounded-full bg-[#D2691E]/12 -translate-x-1/2 -translate-y-1/2 blur-[35px]" />
      <div className="absolute top-4/5 left-1/3 w-[170px] h-[170px] rounded-full bg-[#CD853F]/10 -translate-x-1/2 -translate-y-1/2 blur-[35px]" />
      <div className="absolute top-4/5 right-1/3 w-[170px] h-[170px] rounded-full bg-[#DEB887]/12 -translate-x-1/2 -translate-y-1/2 blur-[35px]" />
      <div className="absolute top-5/6 left-1/6 w-[160px] h-[160px] rounded-full bg-[#8B4513]/10 -translate-x-1/2 blur-[30px]" />
      <div className="absolute top-5/6 right-1/6 w-[160px] h-[160px] rounded-full bg-[#D2691E]/12 -translate-x-1/2 blur-[30px]" />
      <div className="absolute bottom-1/3 left-1/2 w-[200px] h-[200px] rounded-full bg-[#CD853F]/10 -translate-x-1/2 blur-[35px]" />
      <div className="absolute bottom-1/4 right-1/2 w-[200px] h-[200px] rounded-full bg-[#DEB887]/12 -translate-x-1/2 blur-[35px]" />
      <div className="absolute top-7/8 left-1/4 w-[150px] h-[150px] rounded-full bg-[#8B4513]/9 blur-[25px]" />
      <div className="absolute top-7/8 right-1/4 w-[150px] h-[150px] rounded-full bg-[#D2691E]/11 blur-[25px]" />
      <div className="absolute top-7/8 left-1/2 w-[140px] h-[140px] rounded-full bg-[#CD853F]/9 -translate-x-1/2 blur-[25px]" />
      <div className="absolute top-7/8 right-1/2 w-[140px] h-[140px] rounded-full bg-[#DEB887]/11 -translate-x-1/2 blur-[25px]" />
      <div className="absolute top-7/8 left-3/4 w-[130px] h-[130px] rounded-full bg-[#8B4513]/9 blur-[25px]" />
      <div className="absolute top-7/8 right-3/4 w-[130px] h-[130px] rounded-full bg-[#D2691E]/11 blur-[25px]" />
    </>
  ) : null;

  // Prepare search suggestions data
  const searchSuggestionsData = menuItems.map(item => ({
    itemName: item.itemName,
    category: item.category,
  }));

  return (
    <div className='bg-cream min-h-screen relative overflow-hidden pb-28'>
      {/* Paint smudge background - strictly behind MenuItem grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {baseSmudges}
        {extraSmudges}
      </div>

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