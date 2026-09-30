// Owner inventory page: lists stock levels, restocks via RestockModal, edits details
// via EditIngredientModal, and flags low stock
'use client'

import { useCallback, useEffect, useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import AddingIngredientModal from "./ui/AddingIngredientModal";
import RestockModal from "./ui/RestockModal";
import EditIngredientModal from "./ui/EditIngredientModal";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  restockThreshold: number;
}

export default function Inventory() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Which ingredient the restock modal is open for; null means it is closed
  const [restocking, setRestocking] = useState<Ingredient | null>(null);

  // Which ingredient the edit modal is open for; null means it is closed
  const [editing, setEditing] = useState<Ingredient | null>(null);

  const fetchIngredients = useCallback(async () => {
    try {
      const response = await fetch('/api/ingredients');

      // Check response.ok BEFORE reading the body. On failure the route
      // returns an { error } object, not an array, and storing that as the
      // list would crash every .filter() call below.
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      setIngredients(await response.json());
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleDelete = async (ingredientId: number) => {
    try {
      const res = await fetch(`/api/ingredients/${ingredientId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error("Delete failed");

      fetchIngredients();
    } catch (error) {
      console.error("Failed to delete ingredient:", error);
      window.alert("Failed to delete ingredient.");
    }
  };

  const lowStockCount = ingredients.filter(
    i => i.stockQty <= i.restockThreshold
  ).length;

  if (loading) {
    return (
      <p className="text-center py-10 text-dark-brown">
        Loading inventory...
      </p>
    );
  }

  return (
    <section className="min-h-screen bg-cream">
      <OwnerHeader title="INVENTORY MANAGEMENT" />

      <div className="px-4 mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-dark-brown text-white py-3 rounded-lg font-medium hover:bg-dark-brown/90 transition-colors"
        >
          + Add Ingredient
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-red-800 mb-1">
              ⚠️ Low Stock Alert
            </p>
            <p className="text-xs text-red-600">
              {lowStockCount} ingredient{lowStockCount > 1 ? 's' : ''} below threshold
            </p>
          </div>
        </div>
      )}

      <div className="px-4 space-y-3">
        {ingredients.map((ingredient) => {
          const isLowStock = ingredient.stockQty <= ingredient.restockThreshold;

          // FIX: guard against a threshold of 0 (division by zero).
          // With no threshold, show the bar as full.
          const pct =
            ingredient.restockThreshold > 0
              ? Math.min(
                  (ingredient.stockQty / (ingredient.restockThreshold * 2)) * 100,
                  100
                )
              : 100;

          return (
            <div
              key={ingredient.id}

              // The whole card opens the edit modal
              onClick={() => setEditing(ingredient)}
              className={`bg-white rounded-lg p-4 shadow cursor-pointer hover:shadow-md transition-shadow ${
                isLowStock ? 'border-2 border-red-300' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{ingredient.name}</h3>
                  <p className="text-sm text-gray-500">Unit: {ingredient.unit}</p>
                </div>

                {isLowStock && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                    Low Stock
                  </span>
                )}
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Current Stock</span>
                  <span className="font-semibold text-gray-900">
                    {ingredient.stockQty} {ingredient.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Restock Threshold</span>
                  <span className="text-gray-700">
                    {ingredient.restockThreshold} {ingredient.unit}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      isLowStock ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {/* stopPropagation keeps these buttons from also opening the
                    edit modal via the card's own onClick */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRestocking(ingredient);
                  }}
                  className="flex-1 text-sm font-medium text-blue-700 bg-blue-50 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Restock
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ingredient.id);
                  }}
                  className="text-sm font-medium text-red-700 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AddingIngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={fetchIngredients}
      />

      <RestockModal
        ingredient={restocking}
        onClose={() => setRestocking(null)}
        onRestocked={fetchIngredients}
      />

      <EditIngredientModal
        ingredient={editing}
        onClose={() => setEditing(null)}
        onUpdated={fetchIngredients}
      />
    </section>
  );
}