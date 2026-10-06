'use client'

// Edits an existing ingredient's name, unit and restock threshold.
// Stock is deliberately NOT editable here: the only way to change stock is
// Restock, which sends a delta, so a stale screen value can't overwrite real stock.
import { useState } from "react";
import { useToast } from "@/app/ui/Toast";

type EditableIngredient = {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  restockThreshold: number;
};

interface EditIngredientModalProps {
  // The ingredient being edited, or null when the modal is closed
  ingredient: EditableIngredient | null;
  onClose: () => void;

  // Called after a successful save, so the list can refresh
  onUpdated: () => void;
}

const UNITS = [
  { value: "g", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "L", label: "Liters (L)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "packs", label: "Packs (packs)" },
  { value: "pumps", label: "Pumps (pumps)" },
  { value: "scoops", label: "Scoops (scoops)" },
  { value: "servings", label: "Servings (servings)" },
];

// Outer shell: owns the "is it open" check so the inner form can safely read
// a non-null ingredient and seed its state from it as initial values
function EditIngredientModal({ ingredient, onClose, onUpdated }: EditIngredientModalProps) {
  if (!ingredient) return null;

  return (
    <EditIngredientForm
      key={ingredient.id}
      ingredient={ingredient}
      onClose={onClose}
      onUpdated={onUpdated}
    />
  );
}

function EditIngredientForm({
  ingredient,
  onClose,
  onUpdated,
}: {
  ingredient: EditableIngredient;
  onClose: () => void;
  onUpdated: () => void;
}) {
  // Each field starts from the ingredient's current value. The parent's `key`
  // remounts this form when a different ingredient is chosen, so switching
  // between cards never shows the previously edited one's values.
  const [name, setName] = useState(ingredient.name);
  const [unit, setUnit] = useState(ingredient.unit);
  const [restockThreshold, setRestockThreshold] = useState(
    String(ingredient.restockThreshold)
  );
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !unit || restockThreshold === "") {
      showError("Please fill in all fields.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },

        // stockQty is intentionally omitted: PATCH treats it as a set value,
        // and this form must never be able to change stock
        body: JSON.stringify({
          name: name.trim(),
          unit,
          restockThreshold: Number(restockThreshold),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update ingredient");
      }

      onUpdated();
      success("Ingredient updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      showError(
        err instanceof Error ? err.message : "Failed to update ingredient"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Ingredient</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ingredient Name
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. Espresso Beans"
            />
          </div>

          <div>
            <label
              htmlFor="edit-unit"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Unit
            </label>
            <select
              id="edit-unit"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select unit</option>
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-threshold"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Restock Threshold
            </label>
            <input
              id="edit-threshold"
              type="number"
              required
              min="0"
              step="0.01"
              value={restockThreshold}
              onChange={(e) => setRestockThreshold(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. 500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alert when stock falls below this amount
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            Current stock:{" "}
            <span className="font-semibold">{ingredient.stockQty}</span>{" "}
            {ingredient.unit}. Use the Restock button on the card to change it.
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditIngredientModal;
