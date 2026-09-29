// Persisted cart: add, merge, remove, and clear order lines
import { Size } from "@/app/orders/[itemId]/_ui/SizeSelector";
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface OrderItem {
  itemId: number,
  itemName: string,
  itemImg: string,
  selectedSize: Size,
  selectedAddOn: number[],
  quantity: number,
}

interface OrderState {
  orders: OrderItem[],
  addToOrder: (order: OrderItem) => void;
  removeOrder: (order: OrderItem) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      addToOrder: (order) => set((state) => {
        // Same drink + same size row + same add-ons = bump quantity, don't add a second line
        const existing = state.orders.find(
          (i) =>
            i.itemId === order.itemId &&
            i.selectedSize.sizeId === order.selectedSize.sizeId &&
            JSON.stringify(i.selectedAddOn) === JSON.stringify(order.selectedAddOn)
        );

        if (existing) {
          return {
            orders: state.orders.map((i) =>
              i === existing ? { ...i, quantity: i.quantity + order.quantity } : i
            )
          }
        }

        return { orders: [...state.orders, order] };
      }),

      removeOrder: (order) => set((state) => {
        // Keep every line that is NOT this exact combo
        const deleteOrder = state.orders.filter(
          (o) =>
            o.itemId !== order.itemId ||
            o.selectedSize.sizeId !== order.selectedSize.sizeId ||
            JSON.stringify(o.selectedAddOn) !== JSON.stringify(order.selectedAddOn)
        );

        return { orders: deleteOrder }
      }),

      clearOrder: () => set(() => ({ orders: [] }))
    }),
    {
      name: 'order-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)