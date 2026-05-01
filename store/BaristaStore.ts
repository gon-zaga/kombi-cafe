import { persist} from "zustand/middleware";
import { create } from "zustand";
import { Size } from "@/app/orders/[itemId]/_ui/SizeSelector";

interface OrderItem  {
  name: string,
  size: Size,
  addOns: string[]
  quantity: number,
  price: number
}

export interface Order {
  id: number,
  orderReference: string,
  items: OrderItem[]
  orderStatus: 'pending' | 'preparing' | 'ready',
  timestamp: Date, 
  totalPrice: number
}

interface OrderState {
  orders: Order[]
  addOrder: (order: Order) => void
  updateStatus:  (id: number, status: 'pending' | 'preparing'| 'ready') => void
  removeOrder?: (id: number) => void
}

export const useBaristaStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [], 
      addOrder: (order) => set((state) => {
        return {orders: [...state.orders, order]}
      }),
      updateStatus: (id, status) => set((state) => ({
        orders: state.orders.map(order => 
          order.id === id 
          ? {...order, orderStatus: status }
          : order
        ) 
      })),
      removeOrder: (id) => set((state) => ({
        orders: state.orders.filter(order => order.id !== id)
      })),

    }), 
    {
      name: 'barista-store',
    }
  )
) 