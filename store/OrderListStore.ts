import { Size } from "@/app/orders/[itemId]/_ui/SizeSelector";
import {create} from 'zustand'

/* The `export interface OrderItem { ... }` statement in the TypeScript code is defining a TypeScript
interface named `OrderItem`. An interface in TypeScript is a way to define the shape of an object.
In this case, the `OrderItem` interface specifies the structure of an object that represents an item
in an order. */
export interface OrderItem {
  itemId: number, 
  itemName: string, 
  itemImg: string,
  selectedSize: Size, 
  selectedAddOn: number[],
  quantity: number,
  specialInstruction: string 
}
  


/* The `interface OrderState` in the TypeScript code is defining a TypeScript interface named
`OrderState`. This interface specifies the structure of an object that represents the state of
orders in the application. */
interface OrderState {
  orders: OrderItem[],
  addToOrder: (order: OrderItem) => void;
  removeOrder: (order: OrderItem) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
/* This code snippet defines the `addToOrder` function within the `useOrderStore` hook. Here's what it
does: */
  addToOrder: (order) => set((state) => {
    const existing = state.orders.find( 
/* This code snippet is a part of the `addToOrder` function within the `useOrderStore` hook. It is
using the `Array.prototype.find()` method to check if there is an existing order item in the
`state.orders` array that matches the specified conditions. */
      (i) =>
        i.itemId === order.itemId && 
        i.selectedSize.size === order.selectedSize.size &&
        JSON.stringify(i.selectedAddOn) === JSON.stringify(order.selectedAddOn));

      if (existing) {
        return {
          orders: state.orders.map((i) => 
            i === existing ? {...i, quantity: i.quantity + order.quantity} : i
          )
        }
      }
 
    return {orders: [...state.orders, order]};
  }),

  removeOrder: (order) => set((state) => {
    const deleteOrder = state.orders.filter(
      (o) => 
        o.itemId !== order.itemId ||
        o.selectedSize.size !==  order.selectedSize.size ||
        JSON.stringify(o.selectedAddOn) !== JSON.stringify(order.selectedAddOn)); 
  
      return {orders: deleteOrder}
  })


}))
