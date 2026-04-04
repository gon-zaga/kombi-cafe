import { Size } from "@/app/orders/[itemId]/_ui/SizeSelector";
import {create} from 'zustand'


export interface OrderItem {
  itemId: number, 
  itemName: string, 
  itemImg: string,
  selectedSize: Size, 
  selectedAddOn: number[],
  quantity: number,
  specialInstruction: string 
}


/* The `interface OrderState` is defining the structure of the state object that will be managed by the
`useOrderStore` hook. It includes two properties: */
interface OrderState {
  orders: OrderItem[],
  addToOrder: (order: OrderItem) => void;

}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  addToOrder: (order) => set((state) => ({
    orders: [...state.orders, order],
  })),

}))
