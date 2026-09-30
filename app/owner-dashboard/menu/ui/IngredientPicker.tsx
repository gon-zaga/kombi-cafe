'use client'

// Searchable ingredient dropdown: type to filter by name, then pick. A plain
// <select> stops being usable once there are more than a handful of ingredients.
import { useMemo, useState } from "react";

interface IngredientOption {
  id: number;
  name: string;
  unit: string;
}

interface IngredientPickerProps {
  ingredients: IngredientOption[];

  // Selected ingredient id, or '' when nothing is chosen
  value: string;
  onChange: (id: string) => void;

  placeholder?: string;
}

function IngredientPicker({
  ingredients,
  value,
  onChange,
  placeholder = "Select ingredient",
}: IngredientPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selected = ingredients.find((i) => String(i.id) === value);

  // Case-insensitive substring match on the name. A menu item with 20+ items
  // is unusable by scrolling, so typing is the primary way to find one.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, query]);

  const handlePick = (id: number) => {
    onChange(String(id));
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center justify-between gap-2"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-500'}>
          {selected ? `${selected.name} (${selected.unit})` : placeholder}
        </span>
        <span className="text-gray-400 text-xs shrink-0">▾</span>
      </button>

      {isOpen && (
        <>
          {/* Click-away layer, so clicking elsewhere closes the list */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
          />

          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <input
                // autoFocus so the user can type immediately on opening
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ingredients..."
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <ul className="max-h-48 overflow-y-auto">
              {matches.length === 0 && (
                <li className="px-3 py-2 text-xs text-gray-500">
                  No ingredient matches &quot;{query}&quot;
                </li>
              )}

              {matches.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(i.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="text-gray-900 truncate">{i.name}</span>
                    <span className="text-xs text-gray-500 shrink-0">{i.unit}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default IngredientPicker;
