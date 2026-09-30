'use client'

// Recipe editor for one menu item: lists the ingredients that item consumes and
// lets the owner add or remove rows. A row with no size applies to every size;
// a row with a size applies to that size only and overrides the general row.
import { useCallback, useEffect, useState } from "react";
import type { Recipe } from "@/app/api/recipes/route";
import IngredientPicker from "./IngredientPicker";
import AddingIngredientModal from "../../inventory/ui/AddingIngredientModal";

interface IngredientOption {
  id: number;
  name: string;
  unit: string;
}

interface RecipeEditorProps {
  menuItemId: number;

  // The item's own sizes, so the size dropdown only offers sizes this item sells
  itemSizes: { sizeId: number; size: string }[];

  onChanged: () => void;
}

function RecipeEditor({ menuItemId, itemSizes, onChanged }: RecipeEditorProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [loading, setLoading] = useState(true);

  // The row currently being filled in
  const [ingredientId, setIngredientId] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState("");
  const [sizeId, setSizeId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Lets the owner create a new ingredient without leaving this screen
  const [isAddOpen, setIsAddOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [recipeRes, ingredientRes] = await Promise.all([
        fetch(`/api/recipes?menuItemId=${menuItemId}`),
        fetch('/api/ingredients'),
      ]);

      if (!recipeRes.ok) throw new Error('Failed to load recipes');
      if (!ingredientRes.ok) throw new Error('Failed to load ingredients');

      setRecipes(await recipeRes.json());
      setIngredients(await ingredientRes.json());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [menuItemId]);

  useEffect(() => {
    // setState happens inside the async callback, not the effect body
    load();
  }, [load]);

  const sizeLabel = (id: number | null) =>
    id === null
      ? 'All sizes'
      : itemSizes.find((s) => s.sizeId === id)?.size ?? `Size #${id}`;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const qty = Number(quantityNeeded);
    if (!ingredientId || quantityNeeded === "" || isNaN(qty) || qty <= 0) {
      setError('Pick an ingredient and enter a quantity greater than 0.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId,
          ingredientId: Number(ingredientId),
          quantityNeeded: qty,
          // Empty string means "all sizes", which the API turns into NULL
          sizeId: sizeId === '' ? null : Number(sizeId),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add recipe');
      }

      setIngredientId('');
      setQuantityNeeded('');
      setSizeId('');

      await load();
      onChanged();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to add recipe');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recipeId: number) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to remove recipe');
      }

      await load();
      onChanged();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to remove recipe');
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading recipes...</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
          {error}
        </div>
      )}

      {recipes.length === 0 ? (
        <p className="text-xs text-gray-500">
          No ingredients linked yet. Ordering this item won&apos;t deplete any stock.
        </p>
      ) : (
        <ul className="space-y-1">
          {recipes.map((recipe) => (
            <li
              key={recipe.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <span className="text-sm text-gray-900 font-medium">
                  {recipe.ingredientName}
                </span>
                <span className="text-sm text-gray-600">
                  {' '}
                  — {recipe.quantityNeeded} {recipe.unit}
                </span>
                <span className="block text-xs text-gray-500">
                  {sizeLabel(recipe.sizeId)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(recipe.id)}
                className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors shrink-0"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-900">
            Add Ingredient
          </label>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
          >
            + New Ingredient
          </button>
        </div>

        <IngredientPicker
          ingredients={ingredients}
          value={ingredientId}
          onChange={setIngredientId}
        />

        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={quantityNeeded}
            onChange={(e) => setQuantityNeeded(e.target.value)}
            placeholder="Quantity"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <select
            value={sizeId}
            onChange={(e) => setSizeId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All sizes</option>
            {itemSizes.map((s) => (
              <option key={s.sizeId} value={s.sizeId}>
                {s.size} only
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add to Recipe'}
        </button>
      </form>

      {/* Sits above the Edit Item modal: both use z-50, and this one is later
          in the DOM, so it stacks on top. The modal returns null when closed. */}
      <AddingIngredientModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdded={load}
      />
    </div>
  );
}

export default RecipeEditor;
