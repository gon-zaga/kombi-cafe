'use client';

// Barista queue: live orders from GET /api/orders?range=today, plus a focus card that
// auto-opens the longest-waiting order and advances on its own, so each order needs one click
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getRelativeTime } from '@/app/lib/utils';
import { useRouter } from 'next/navigation';
import OrderDetailModal from './OrderDetailModal';
import type { OrderSummary } from '@/app/lib/types';

// Identifies an order at a specific status, so an order skipped as "pending"
// becomes eligible again once it moves to "preparing" or "ready"
const orderKey = (order: OrderSummary) => `${order.id}:${order.status}`;

export default function BaristaPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  // The order the barista deliberately clicked, or null to let the queue decide
  const [focusedId, setFocusedId] = useState<number | null>(null);

  // Orders the barista dismissed with X, keyed by id + status
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  // Failed status update, shown as a banner. This used to be window.alert,
  // which renders as "localhost says" and is banned for new UI.
  const [actionError, setActionError] = useState('');
  const router = useRouter();
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  // Tracks whether the component is still mounted so a poll that lands
  // after unmount (or after the interval is cleared) doesn't set state
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const pending = orders.filter((o) => o.status === 'pending').length;
  const preparing = orders.filter((o) => o.status === 'preparing').length;
  const ready = orders.filter((o) => o.status === 'ready').length;

  const fetchOrders = useCallback(async () => {
    const response = await fetch('/api/orders?range=today');
    if (!response.ok) return [] as OrderSummary[];
    const data: OrderSummary[] = await response.json();

    // Completed orders are dropped here, once, instead of being filtered at
    // every use below. They stay in the database for sales history; the barista
    // board just stops showing them.
    const active = data.filter((o) => o.status !== 'completed');

    if (mountedRef.current) setOrders(active);
    return active;
  }, []);

  useEffect(() => {
    // setOrders happens inside the async callback, not in the effect body,
    // so this is a subscription to an external system, not a cascading render
    async function poll() {
      try {
        await fetchOrders();
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    }

    poll();
    const interval = setInterval(poll, 3000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

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

  // Waiting orders, longest-waiting first. 'ready' orders leave the queue entirely
  const queue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'ready')
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [orders]
  );

  // Which order the card shows, computed from the queue instead of stored.
  // A manually clicked order wins while it still exists, so a finished order can
  // be opened and inspected; otherwise the card falls to the oldest order the
  // barista hasn't dismissed. Because this is derived, polling can never leave
  // the card stuck on a finished order once focus is released.
  const focusedOrder = useMemo(() => {
    if (focusedId !== null) {
      const chosen = orders.find((o) => o.id === focusedId);
      if (chosen && !skipped.has(orderKey(chosen))) return chosen;
    }
    return queue.find((o) => !skipped.has(orderKey(o))) ?? null;
  }, [orders, queue, focusedId, skipped]);

  // X or a backdrop click: set this order aside until its status changes
  const handleSkip = () => {
    if (focusedOrder) {
      const key = orderKey(focusedOrder);
      setSkipped((prev) => new Set(prev).add(key));
    }
    setFocusedId(null);
  };

  async function handleUpdateStatus(
    id: number,
    status: 'pending' | 'preparing' | 'ready' | 'completed'
  ) {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setActionError(data.error || 'Failed to update order');
      return;
    }

    // 'ready' and 'completed' both end the order's turn, so the card moves on by
    // itself. 'preparing' leaves the card on the same order.
    if (status === 'ready' || status === 'completed') {
      setFocusedId(null);
    }

    setActionError('');
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

      {/* Status update failure, e.g. the DB rejecting an unknown status */}
      {actionError && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-4">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError('')}
            className="text-red-700 hover:text-red-900 font-bold"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">Order Queue</p>
        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
          {orders.length} active
        </span>
      </div>

      <div className="px-4 pb-6 flex flex-col gap-2">
        {orders.map((order) => {
          // Finished orders fade back so the barista's attention stays on what's
          // still being worked. Skipped orders stay full opacity: they were set
          // aside on purpose and still need to be clickable.
          const isDone = order.status === 'ready';

          return (
            <div
              key={order.id}
              onClick={() => {
                // An explicit choice overrides the queue, and clears any earlier skip
                setFocusedId(order.id);
                setSkipped((prev) => {
                  const next = new Set(prev);
                  next.delete(orderKey(order));
                  return next;
                });
              }}
              className={`bg-white rounded-xl border border-gray-200 p-3.5 cursor-pointer ${
                isDone ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {order.orderReference}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.items.map((item) => `${item.size} ${item.name}`).join(' · ')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="text-xs text-gray-400">
                    {getRelativeTime(order.createdAt)}
                  </p>

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
          );
        })}

        <OrderDetailModal
          order={focusedOrder}
          onClose={handleSkip}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </div>
  );
}
