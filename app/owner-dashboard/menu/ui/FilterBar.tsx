'use client'

interface FilterBarProps {
  currentAvailbility: string
  currentCategory: string
  onAvailabilityChange: (value: string) => void
  onCategoryChange: (value: string) => void
}
function FilterBar ({currentAvailbility, currentCategory, onAvailabilityChange, onCategoryChange}: FilterBarProps){
  
  const categories = [
    "All",
    "Kaffee",
    "Klassik Kaffee",
    "Specialty Kaffee",
    "Kaffee Frappe",
    "Non-Kaffee Latte",
    "Fruitee Latte",
    "The Beetles Juice", 
    "Non-Kaffee Frappe",
    "Snacks"
  ];

  return(
    <section className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
      {/* Availability Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => onAvailabilityChange('All')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentAvailbility === 'All'
              ? 'bg-dark-brown text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onAvailabilityChange('Available')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentAvailbility === 'Available'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Available
        </button>
        <button
          onClick={() => onAvailabilityChange('Unavailable')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentAvailbility === 'Unavailable'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Unavailable
        </button>
      </div>

      {/* Category Dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Category:</label>
        <select
          value={currentCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

export default FilterBar;
