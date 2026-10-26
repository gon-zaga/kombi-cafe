// Persisted order type selection: stores whether customer chose dine-in or takeout
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type OrderType = 'dine_in' | 'takeout' | null;

interface OrderTypeState {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  clearOrderType: () => void;
}

export const useOrderTypeStore = create<OrderTypeState>()(
  persist(
    (set) => ({
      orderType: null,
      setOrderType: (type) => set(() => ({ orderType: type })),
      clearOrderType: () => set(() => ({ orderType: null })),
    }),
    {
      name: 'order-type-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)