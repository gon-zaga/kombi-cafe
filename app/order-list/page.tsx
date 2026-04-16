'use client'

import OrderCard from './_ui/OrderCard';
import Header from '../ui/Header';
import { addOns } from '../lib/data';
import { useOrderStore  } from '@/store/OrderListStore';
import PlaceOrderButton from './_ui/PlaceOrderButton';

function OrdersLists() {
  const {orders, removeOrder} = useOrderStore();
  const grandtotal =  orders.reduce((acc, order) => acc + order.selectedSize.price * order.quantity, 0);
  return (
        
    <div>
      <Header />
      {
        
        orders.map((order) => ( 
            <OrderCard key={`${order.itemId}-${JSON.stringify(order.selectedAddOn)}`} order={order} addOns={addOns} onDelete={() => removeOrder(order)} />
        ))
      }
      <PlaceOrderButton grandtotal={grandtotal}/>
      
    </div>
  );
} 

export default OrdersLists  