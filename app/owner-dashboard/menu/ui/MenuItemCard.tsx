import Image from "next/image"

interface MenuItemCardProps {
  item: {
    itemId: number
    itemName: string
    category: string
    itemImg: string
  }
}

function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      
      {/* Top row: Image + Details + Toggle */}
      <div className="flex flex-row items-center gap-4">
        {/* Image */}
        <div className="shrink-0">
          <Image
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
        </div>

        {/* Available Toggle */}
        <div className="flex-shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            {/* Track */}
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:bg-green-500 transition-colors">
              {/* Thumb — must be INSIDE the track div to inherit peer state */}
              <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>
      </div>

      {/* Bottom row: Action Buttons */}
      <div className="flex flex-row gap-2 justify-end">
        <button className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          Edit
        </button>
        <button className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
          Delete
        </button>
      </div>

    </div>
  )
}

export default MenuItemCard