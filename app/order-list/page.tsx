'use client'

import OrderCard from './_ui/OrderCard';
import Header from '../ui/Header';
import { addOns } from '../lib/data';
import { useOrderStore  } from '@/store/OrderListStore';

function OrdersLists() {
  const {orders, removeOrder} = useOrderStore();
  return (
        
    <div>
      <Header />
      {
        
        orders.map((order) => (
          <>
            <OrderCard key={`${order.itemId}-${JSON.stringify(order.selectedAddOn)}`} order={order} addOns={addOns} onDelete={() => removeOrder(order)} />
          </>
        ))
      }
    </div>
  );
}`` 

export default OrdersLists  