'use client'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
}

function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    onClose();
  };

  return (
    // BACKDROP
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* MODAL CONTENT */}
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add New Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. Kombi Latte"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select a category</option>
              <option value="1">Coffee</option>
              <option value="2">Matcha</option>
              <option value="3">Fruit Tea</option>
              <option value="4">Milk Tea</option>
              <option value="5">Smoothie</option>
              <option value="6">Pastry</option>
              <option value="7">Snacks</option>
            </select>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="/drinks/item-name.jpg"
            />
          </div>

          {/* Available Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Sizes
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
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddItemModal
