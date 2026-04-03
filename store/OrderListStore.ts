import { Size } from "@/app/orders/[itemId]/_ui/SizeSelector";
import {create} from 'zustand'

interface OrderItem {
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

}

const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  addToOrder: (order) => set((state) => ({
    orders: [...state.orders, order],
  })),

}))
