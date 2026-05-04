'use client'

interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
}

function EditItemModal({ isOpen, onClose }: EditItemModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Menu Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Edit Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Edit Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Item name"
            />
          </div>

          {/* Edit Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Edit Category
            </label>
            <select
              
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select category</option>
              <option value="Kaffee">Kaffee</option>
              <option value="Klassik Kaffee">Klassik Kaffee</option>
              <option value="Specialty Kaffee">Specialty Kaffee</option>
              <option value="Kaffee Frappe">Kaffee Frappe</option>
              <option value="Non-Kaffee Latte">Non-Kaffee Latte</option>
              <option value="Fruitee Latte">Fruitee Latte</option>
              <option value="The Beetles Juice">The Beetles Juice</option>
              <option value="Non-Kaffee Frappe">Non-Kaffee Frappe</option>
              <option value="Snacks">Snacks</option>
            </select>
          </div>

          {/* Edit Image URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Edit Image URL
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="/drinks/item-name.jpg"
            />
          </div>

          {/* Edit Size Available */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Edit Size Available
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">Kafer (12oz Hot)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">Hippie (16oz Iced)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">Bulli (22oz Iced)</span>
              </label>
            </div>
          </div>

          {/* Edit Price Per Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Edit Price Per Size
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 w-32">Kafer (12oz):</span>
                <input
                  type="number"
                  placeholder="₱0.00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 w-32">Hippie (16oz):</span>
                <input
                  type="number"
                  placeholder="₱0.00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 w-32">Bulli (22oz):</span>
                <input
                  type="number"
                  placeholder="₱0.00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Available Toggle */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <span className="ml-2 text-sm text-gray-700">Available for ordering</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditItemModal