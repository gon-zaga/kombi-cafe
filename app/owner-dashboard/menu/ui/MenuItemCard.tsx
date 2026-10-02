import type { MouseEvent } from "react"
import ItemImage from "@/app/ui/ItemImage"

interface MenuItemCardProps {
  item: {
    itemId: number
    itemName: string
    category: string | null
    itemImg: string | null
  }
  isAvailable: boolean
  onToggle: (checked: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onIngredients: () => void
}

function MenuItemCard({
  item,
  isAvailable,
  onToggle,
  onEdit,
  onDelete,
  onIngredients,
}: MenuItemCardProps) {
  // The whole card opens Edit, so any click that STARTS on an inner control
  // (the availability toggle, or one of the action buttons) must not count.
  //
  // This checks where the click came from instead of relying on
  // stopPropagation inside those controls: a control that hides its real input
  // (the toggle is sr-only) can forward a second, un-stoppable click, and
  // propagation-based guards failed in practice. `closest()` walks up from the
  // exact element that was hit, so it can't be bypassed.
  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-card-control]")) return
    onEdit()
  }

  return (
    // The ring + cursor make the card's clickable area obvious, instead of it
    // being an unlabelled box.
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow p-4 flex flex-col gap-3 cursor-pointer
                 ring-1 ring-gray-200 hover:ring-2 hover:ring-amber-400
                 hover:shadow-md transition-all"
    >

      {/* Top row: Image + Details + Toggle */}
      <div className="flex flex-row items-center gap-4">
        {/* Image */}
        <div className="shrink-0">
          <ItemImage
            src={item.itemImg}
            alt={item.itemName}
            width={80}
            height={80}
            className="rounded-lg object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <span className="font-semibold text-gray-900 truncate">{item.itemName}</span>
          <span className="text-sm text-gray-600 truncate">{item.category}</span>
          <span className="text-xs text-gray-400">Click card to edit</span>
        </div>

        {/* Available Toggle */}
        <div className="shrink-0" data-card-control>
          {/* The input is sr-only, so the visible pill/knob divs are what get
              clicked; a label click forwards activation to the input, which is
              why onChange still fires. */}
          <label
            onClick={(e) => e.stopPropagation()}
            title={isAvailable ? "Available — click to mark unavailable" : "Unavailable — click to mark available"}
            className="relative inline-flex items-center cursor-pointer"
          >
              <input
                type="checkbox"
                checked={isAvailable}
                aria-label={`Mark ${item.itemName} as ${isAvailable ? "unavailable" : "available"}`}
                onChange={(e) => onToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-green-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
          </label>
        </div>
      </div>

      {/* Bottom row: Action Buttons */}
      {/* The whole row is one control region, so a click on any of these
          buttons can never reach the card's Edit handler */}
      <div className="flex flex-row gap-2 justify-end" data-card-control>
        <button
          onClick={onIngredients}
          className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          Ingredients
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default MenuItemCard