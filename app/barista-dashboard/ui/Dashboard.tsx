'use client';

// Barista queue: live orders from GET /api/orders?range=today, not the old mock store
import { useState, useEffect } from 'react';
import { getRelativeTime } from '@/app/lib/utils';
import { useRouter } from 'next/navigation';
import OrderDetailModal from './OrderDetailModal';
import type { OrderSummary } from '@/app/lib/types';

export default function BaristaPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const router = useRouter();
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  const pending = orders.filter((o) => o.status === 'pending').length;
  const preparing = orders.filter((o) => o.status === 'preparing').length;
  const ready = orders.filter((o) => o.status === 'ready').length;

  async function fetchOrders() {
    const response = await fetch('/api/orders?range=today');
    const data: OrderSummary[] = await response.json();
    setOrders(data);
    // Keep the open modal in sync if this order is still in today's list
    setSelectedOrder((current) =>
      current ? data.find((o) => o.id === current.id) ?? null : null
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await fetch('/api/orders?range=today');
        const data: OrderSummary[] = await response.json();
        if (!isMounted) return;
        setOrders(data);
        setSelectedOrder((current) =>
          current ? data.find((o) => o.id === current.id) ?? null : null
        );
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    }

    load();
    const interval = setInterval(load, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }));
      setDateString(now.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }));
    };

    update();
    const clock = setInterval(update, 1000);
    return () => clearInterval(clock);
  }, []);

  async function handleUpdateStatus(
    id: number,
    status: 'pending' | 'preparing' | 'ready'
  ) {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || 'Failed to update order');
      return;
    }

    await fetchOrders();
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 bg-dark-brown border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm text-white font-medium">Barista Dashboard</p>
          <span className="text-xs text-white">{timeString} - {dateString}</span>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-xs text-white border border-gray-300 rounded-md px-3 py-1.5 hover:bg-white/10 transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-3 gap-2 px-4 py-4 bg-white border-b border-gray-200">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Pending</p>
          <p className="text-3xl font-mono font-medium text-amber-900 mt-1">{pending}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Preparing</p>
          <p className="text-3xl font-mono font-medium text-blue-900 mt-1">{preparing}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Ready</p>
          <p className="text-3xl font-mono font-medium text-green-900 mt-1">{ready}</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">Order Queue</p>
        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
          {orders.length} orders
        </span>
      </div>

      <div className="px-4 pb-6 flex flex-col gap-2">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="bg-white rounded-xl border border-gray-200 p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-medium text-gray-900">{order.orderReference}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.items.map((item) => `${item.size} ${item.name}`).join(' · ')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className="text-xs text-gray-400">{getRelativeTime(order.createdAt)}</p>

                {order.status === 'pending' && (
                  <span className="text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5">
                    Pending
                  </span>
                )}
                {order.status === 'preparing' && (
                  <span className="text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 rounded-full px-2.5 py-0.5">
                    Preparing
                  </span>
                )}
                {order.status === 'ready' && (
                  <span className="text-xs font-medium bg-green-50 text-green-800 border border-green-200 rounded-full px-2.5 py-0.5">
                    Ready
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </div>
  );
}