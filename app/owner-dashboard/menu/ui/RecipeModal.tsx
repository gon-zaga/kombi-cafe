'use client'

// Standalone modal for one menu item's recipe (which ingredients it consumes).
// Kept separate from the Edit modal so "what does this drink need" is its own
// task and doesn't have to be scrolled to inside a long edit form.
import { forwardRef, useRef } from "react";
import RecipeEditor from "./RecipeEditor";
import { useToast } from "@/app/ui/Toast";

interface RecipeModalProps {
  isOpen: boolean;

  // The item whose recipe is being edited
  item: {
    itemId: number;
    itemName: string;
    sizes: { sizeId: number; size: string }[];
  } | null;

  onClose: () => void;

  // Called after a recipe is added or removed, so the parent can refresh
  onChanged: () => void;
}

function RecipeModal({ isOpen, item, onClose, onChanged }: RecipeModalProps) {
  const recipeEditorRef = useRef<any>(null);
  const { error: showError } = useToast();

  const handleClose = () => {
    // Check if recipe editor is valid (has at least one ingredient)
    if (recipeEditorRef.current && recipeEditorRef.current.isValid) {
      if (!recipeEditorRef.current.isValid()) {
        showError("Please add at least one ingredient before closing.");
        return;
      }
    }
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
            <p className="text-sm text-gray-500">{item.itemName}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Stock used per drink. A row with no size applies to every size; a row
          with a size applies to that size only.
        </p>

        <RecipeEditor
          ref={recipeEditorRef}
          menuItemId={item.itemId}
          itemSizes={item.sizes}
          onChanged={onChanged}
        />
      </div>
    </div>
  );
}

export default RecipeModal;
