'use client'
import { useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import AddingIngredientModal from "./ui/AddingIngredientModal";

export default function Inventory() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const ingredients = [
    { id: 1, name: "Espresso Beans", unit: "g", stock: 2500, threshold: 500 },
    { id: 2, name: "Milk", unit: "ml", stock: 3000, threshold: 1000 },
    { id: 3, name: "Sugar", unit: "g", stock: 800, threshold: 500 },
    { id: 4, name: "Vanilla Syrup", unit: "ml", stock: 450, threshold: 500 },
    { id: 5, name: "Chocolate Powder", unit: "g", stock: 1200, threshold: 300 },
  ];

  return (
    <section className="min-h-screen bg-cream">
      <OwnerHeader title="INVENTORY MANAGEMENT" />

      {/* Add Ingredient Button */}
      <div className="px-4 mb-4">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-dark-brown text-white py-3 rounded-lg font-medium hover:bg-dark-brown/90 transition-colors"
        >
          + Add Ingredient
        </button>
      </div>

      {/* Low Stock Alert */}
      <div className="px-4 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Low Stock Alert</p>
          <p className="text-xs text-red-600">1 ingredient below threshold</p>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="px-4 space-y-3">
        {ingredients.map((ingredient) => {
          const isLowStock = ingredient.stock <= ingredient.threshold;
          
          return (
            <div
              key={ingredient.id}
              className={`bg-white rounded-lg p-4 shadow ${
                isLowStock ? 'border-2 border-red-300' : ''
              }`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{ingredient.name}</h3>
                  <p className="text-sm text-gray-500">
                    Unit: {ingredient.unit}
                  </p>
                </div>
                {isLowStock && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                    Low Stock
                  </span>
                )}
              </div>

              {/* Stock Info */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Current Stock</span>
                  <span className="font-semibold text-gray-900">
                    {ingredient.stock} {ingredient.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Restock Threshold</span>
                  <span className="text-gray-700">
                    {ingredient.threshold} {ingredient.unit}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      isLowStock ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        (ingredient.stock / (ingredient.threshold * 2)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="flex-1 text-sm font-medium text-blue-700 bg-blue-50 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                  Restock
                </button>
                <button className="flex-1 text-sm font-medium text-gray-700 bg-gray-100 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  Edit
                </button>
                <button className="text-sm font-medium text-red-700 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AddingIngredientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}