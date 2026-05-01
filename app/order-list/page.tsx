'use client'

import OrderCard from './_ui/OrderCard';
import Header from '../ui/Header';
import { addOns } from '../lib/data';
import { useOrderStore  } from '@/store/OrderListStore';
import PlaceOrderButton from './_ui/PlaceOrderButton';
import EmptyOrder from './_ui/EmptyOrder';
import { useEffect, useState } from 'react';

function OrdersLists() {
  const {orders, removeOrder} = useOrderStore();
  const grandtotal =  orders.reduce((acc, order) => acc + order.selectedSize.price * order.quantity, 0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useOrderStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    /*if(useOrderStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    */
    return () => unsub();
  }, [])
  

  if (!hydrated) return null;

  return (
        
    <div className='min-h-screen'>
      <Header />

      {orders.length === 0 
        
       ?<EmptyOrder />

       :orders.map((order) => (      
            <OrderCard key={`${order.itemId}-${JSON.stringify(order.selectedAddOn)}`} order={order} addOns={addOns} onDelete={() => removeOrder(order)} />
        ))
       }

      {
        orders.length > 0 && (
          <PlaceOrderButton grandtotal={grandtotal}/>
        )
      }
      
    </div>
  );
} 

export default OrdersLists  