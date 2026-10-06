'use client'

// Lets the owner add an amount to an ingredient's stock; sends stockDelta so the
// database adds it to the current value instead of overwriting it
import { useState } from "react";
import { useToast } from "@/app/ui/Toast";

interface RestockModalProps {
  // The ingredient being restocked, or null when the modal is closed
  ingredient: {
    id: number;
    name: string;
    unit: string;
    stockQty: number;
  } | null;

  onClose: () => void;

  // Called after the stock was successfully updated, so the list can refresh
  onRestocked: () => void;
}

function RestockModal({ ingredient, onClose, onRestocked }: RestockModalProps) {
  // Holds the amount the owner typed, kept as a string so an empty
  // input isn't coerced to 0 while they're still typing
  const [amount, setAmount] = useState("");

  // Tracks whether the PATCH is in flight, to disable the button
  const [submitting, setSubmitting] = useState(false);

  const { success, error: showError } = useToast();

  if (!ingredient) return null;

  // Parses the input and rejects anything that isn't a positive number.
  // Returns null when the value is unusable, so the caller can bail out.
  const parseAmount = (): number | null => {
    const parsed = Number(amount);

    if (amount.trim() === "" || isNaN(parsed) || parsed <= 0) {
      showError("Enter an amount greater than 0.");
      return null;
    }

    return parsed;
  };

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const delta = parseAmount();
    if (delta === null) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },

        // Only the amount to add is sent. The route does stock_qty + delta,
        // so a stale stock number on screen can never overwrite the real value.
        body: JSON.stringify({ stockDelta: delta }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to restock ingredient");
      }

      onRestocked();
      success("Stock updated successfully!");
      handleClose();
    } catch (err) {
      console.error(err);
      showError(
        err instanceof Error ? err.message : "Failed to restock ingredient"
      );
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
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-gray-900">Restock</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {ingredient.name} · currently {ingredient.stockQty} {ingredient.unit}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="restock-amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount to add ({ingredient.unit})
            </label>
            <input
              id="restock-amount"
              type="number"

              // Decimals are allowed because stock is tracked in units like g
              // and ml, where 2.5 is a normal amount
              step="0.01"
              min="0"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. 500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is added to the current stock, not a new total
            </p>
          </div>

          <div className="flex gap-2 pt-2">
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
              {submitting ? "Saving..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RestockModal;
