import Image from "next/image"

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
  return (
    // The whole card opens Edit. The ring + cursor make that clickable area
    // obvious, instead of it being an unlabelled box.
    <div
      onClick={onEdit}
      className="bg-white rounded-lg shadow p-4 flex flex-col gap-3 cursor-pointer
                 ring-1 ring-gray-200 hover:ring-2 hover:ring-amber-400
                 hover:shadow-md transition-all"
    >

      {/* Top row: Image + Details + Toggle */}
      <div className="flex flex-row items-center gap-4">
        {/* Image */}
        <div className="shrink-0">
          <Image
            src={item.itemImg ?? '/drinks/no-drink-image.svg'}
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
        <div className="shrink-0">
         <label className="relative inline-flex items-center cursor-pointer">
              {/* stopPropagation so flipping availability doesn't also open Edit */}
              <input
                type="checkbox"
                checked={isAvailable}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-green-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
          </label>
        </div>
      </div>

      {/* Bottom row: Action Buttons */}
      {/* stopPropagation on each so they don't bubble up to the card's Edit */}
      <div className="flex flex-row gap-2 justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); onIngredients(); }}
          className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          Ingredients
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default MenuItemCard
