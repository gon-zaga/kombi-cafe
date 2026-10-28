'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/app/ui/ProductCard";
import type { MenuItem, OrderSummary } from "@/app/lib/types";

interface CarouselItem {
  item: MenuItem;
  soldCount: number;
}

export default function BestSellers({ menuItems }: { menuItems: MenuItem[] }) {
  const [soldByName, setSoldByName] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef({
    animationId: 0,
    lastTime: 0,
    baseElapsed: 0,
    dragOffset: 0,
    momentumVelocity: 0,
    isDragging: false,
    lastDragX: 0,
    lastDragTime: 0,
  });

  // Responsive card width: ~45% of viewport on mobile (2 cards visible), up to 160px on desktop
const CARD_WIDTH = typeof window !== 'undefined'
    ? Math.min(window.innerWidth * 0.5, 200)
    : 200;
  const GAP = 12;
  const SLIDE_UNIT = CARD_WIDTH + GAP;
  const ANIMATION_DURATION = 25000;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/orders?range=month');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const orders: OrderSummary[] = await res.json();

        const tally: Record<string, number> = {};
        for (const order of orders) {
          for (const item of order.items) {
            tally[item.name] = (tally[item.name] ?? 0) + item.quantity;
          }
        }
        if (!cancelled) setSoldByName(tally);
      } catch (error) {
        console.error(error);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const carouselItems = useMemo((): CarouselItem[] => {
    return Object.entries(soldByName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => {
        const item = menuItems.find((m) => m.isAvailable && m.itemName === name);
        return item ? { item, soldCount: count } : null;
      })
      .filter((c): c is CarouselItem => c != null);
  }, [soldByName, menuItems]);

  const totalItems = carouselItems.length * 2;
  const trackWidth = SLIDE_UNIT * totalItems;
  const animationDistance = SLIDE_UNIT * carouselItems.length;

  const DRAG_SENSITIVITY = 1.0;
  const MOMENTUM_DECAY = 0.95;
  const MOMENTUM_THRESHOLD = 0.5;

  const applyTransform = (translateX: number) => {
    const track = trackRef.current;
    if (track) {
      track.style.transform = `translateX(${translateX}px)`;
    }
  };

  const getAutoScrollTranslateX = (elapsed: number) => {
    const progress = (elapsed % ANIMATION_DURATION) / ANIMATION_DURATION;
    return -progress * animationDistance;
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const ref = animRef.current;
    ref.lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - ref.lastTime;
      ref.lastTime = currentTime;

      let translateX = 0;

      if (ref.isDragging) {
        const autoTranslateX = getAutoScrollTranslateX(ref.baseElapsed);
        translateX = autoTranslateX + ref.dragOffset;
      } else if (Math.abs(ref.momentumVelocity) > MOMENTUM_THRESHOLD) {
        ref.baseElapsed += ref.momentumVelocity;
        ref.momentumVelocity *= MOMENTUM_DECAY;
        translateX = getAutoScrollTranslateX(ref.baseElapsed);
      } else {
        ref.baseElapsed += deltaTime;
        translateX = getAutoScrollTranslateX(ref.baseElapsed);
      }

      applyTransform(translateX);
      ref.animationId = requestAnimationFrame(animate);
    };

    ref.animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.animationId);
  }, [animationDistance, carouselItems.length]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Let clickable cards (Links) handle their own navigation
    if ((e.target as HTMLElement).closest('a')) return;

    const ref = animRef.current;
    ref.isDragging = true;
    ref.lastDragX = e.clientX;
    ref.lastDragTime = performance.now();
    ref.dragOffset = 0;
    ref.momentumVelocity = 0;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const ref = animRef.current;
    if (!ref.isDragging) return;

    const currentTime = performance.now();
    const deltaX = (e.clientX - ref.lastDragX) * DRAG_SENSITIVITY;
    const deltaTime = currentTime - ref.lastDragTime;

    ref.dragOffset += deltaX;

    if (deltaTime > 0) {
      const velocity = deltaX / deltaTime;
      ref.momentumVelocity = velocity;
    }

    ref.lastDragX = e.clientX;
    ref.lastDragTime = currentTime;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const ref = animRef.current;
    if (!ref.isDragging) return;

    const currentTranslateX = getAutoScrollTranslateX(ref.baseElapsed);
    const newTranslateX = currentTranslateX + ref.dragOffset;
    const progress = -newTranslateX / animationDistance;
    ref.baseElapsed = ((progress % 1) + 1) % 1 * ANIMATION_DURATION;
    ref.dragOffset = 0;

    ref.isDragging = false;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    const ref = animRef.current;
    if (!ref.isDragging) return;

    const currentTranslateX = getAutoScrollTranslateX(ref.baseElapsed);
    const newTranslateX = currentTranslateX + ref.dragOffset;
    const progress = -newTranslateX / animationDistance;
    ref.baseElapsed = ((progress % 1) + 1) % 1 * ANIMATION_DURATION;
    ref.dragOffset = 0;

    ref.isDragging = false;
    setIsDragging(false);
  };

  const duplicatedItems = [...carouselItems, ...carouselItems];

  if (carouselItems.length === 0) return null;

  return (
    <section className="px-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-roboto-condensed text-sm tracking-[0.2em] text-dark-brown/60">
          BEST SELLERS
        </h3>
        <span className="text-xs text-dark-brown/50 font-roboto-condensed tracking-wide">
          Updated monthly
        </span>
      </div>

      <div
        className="relative"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          overflow: 'hidden',
          maxWidth: '1400px',
          margin: '0 auto',
        } as React.CSSProperties}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        role="region"
        aria-label="Best sellers carousel"
        aria-roledescription="carousel"
      >
        <div
          ref={trackRef}
          className="flex"
          style={{
            width: `${trackWidth}px`,
            gap: `${GAP}px`,
          } as React.CSSProperties}
        >
          {duplicatedItems.map((carouselItem, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{ width: `${CARD_WIDTH}px` } as React.CSSProperties}
            >
              <ProductCard
                item={carouselItem.item}
                tag="best"
                sublabel={`${carouselItem.soldCount} sold`}
                className="h-full min-w-0"
              />
            </div>
          ))}
        </div>

        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-cream via-cream/50 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-cream via-cream/50 to-transparent pointer-events-none" aria-hidden="true" />
      </div>
    </section>
  );
}