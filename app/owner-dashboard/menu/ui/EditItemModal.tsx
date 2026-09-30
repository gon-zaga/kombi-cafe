'use client'

// Edits a menu item's details. Its recipe (ingredients used) is a separate
// modal — see RecipeModal — so this form stays short.
import { useEffect, useState } from "react";
import type { MenuItem } from "@/app/lib/types";

interface Category {
  id: number;
  name: string;
}

interface SizeOption {
  id: number;
  label: string;
  oz: number | null;
  temperature: string | null;
}

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onUpdated: () => void;
}

function EditItemModal({ isOpen, onClose, item, onUpdated }: EditItemModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([]);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // e.g. { 1: true, 2: false }
  const [selectedSizes, setSelectedSizes] = useState<Record<number, boolean>>({});
  // e.g. { 1: "90", 2: "80" }
  const [prices, setPrices] = useState<Record<number, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Runs when the modal opens or the item changes
  useEffect(() => {
    if (!isOpen || !item) return;

    async function loadOptionsAndPrefill() {
      try {
        const [catRes, sizeRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/sizes'),
        ]);

        const cats: Category[] = await catRes.json();
        const sizes: SizeOption[] = await sizeRes.json();

        setCategories(cats);
        setSizeOptions(sizes);

        setName(item!.itemName);
        setImageUrl(item!.itemImg ?? "");

        // FIX: load the item's real availability so saving an edit
        // doesn't silently turn an unavailable item back on
        setIsAvailable(item!.isAvailable);

        const matchedCat = cats.find(c => c.name === item!.category);
        setCategoryId(matchedCat ? String(matchedCat.id) : "");

        const sel: Record<number, boolean> = {};
        const pr: Record<number, string> = {};

        for (const s of sizes) {
          const match = item!.sizes.find(itemSize => itemSize.size === s.label);
          if (match) {
            sel[s.id] = true;
            pr[s.id] = String(match.price);
          }
        }

        setSelectedSizes(sel);
        setPrices(pr);
      } catch (err) {
        console.error("Failed to load edit form data:", err);
      }
    }

    loadOptionsAndPrefill();
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleClose = () => {
    setError("");
    onClose();
  };

  const toggleSize = (sizeId: number) => {
    setSelectedSizes(prev => ({ ...prev, [sizeId]: !prev[sizeId] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const sizes = sizeOptions
      .filter(s => selectedSizes[s.id])
      .map(s => ({
        sizeId: s.id,
        price: Number(prices[s.id] || 0)
      }));

    if (!name || !categoryId || sizes.length === 0) {
      setError("Please fill in the item name, category, and at least one size with a price.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/menu/${item.itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          categoryId: Number(categoryId),
          imageUrl: imageUrl || undefined,
          isAvailable,
          sizes,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update item");
      }

      onUpdated();
      handleClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Menu Item</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Edit Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Item name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Edit Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Edit Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="/drinks/item-name.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Sizes & Prices</label>
            <div className="space-y-2">
              {sizeOptions.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!selectedSizes[s.id]}
                    onChange={() => toggleSize(s.id)}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />

                  <span className="text-sm text-gray-700 w-32">
                    {s.label}
                    {s.oz ? ` (${s.oz}oz ${s.temperature ?? ''})` : ''}
                  </span>

                  {selectedSizes[s.id] && (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prices[s.id] ?? ''}
                      onChange={(e) =>
                        setPrices(prev => ({ ...prev, [s.id]: e.target.value }))
                      }
                      placeholder="Price"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <span className="ml-2 text-sm text-gray-700">Available for ordering</span>
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditItemModal;