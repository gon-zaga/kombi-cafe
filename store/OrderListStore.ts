// OrderListStore.ts
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
  specialInstruction: string
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
        const existing = state.orders.find(
          (i) =>
            i.itemId === order.itemId &&
            i.selectedSize.size === order.selectedSize.size &&
            JSON.stringify(i.selectedAddOn) === JSON.stringify(order.selectedAddOn));

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
        const deleteOrder = state.orders.filter(
          (o) =>
            o.itemId !== order.itemId ||
            o.selectedSize.size !== order.selectedSize.size ||
            JSON.stringify(o.selectedAddOn) !== JSON.stringify(order.selectedAddOn));

        return { orders: deleteOrder }
      }),

      clearOrder: () => set(() => ({ orders: [] }))
    }),
    { name: 'order-store' ,
    storage: createJSONStorage(() => localStorage),
    }
  )
)