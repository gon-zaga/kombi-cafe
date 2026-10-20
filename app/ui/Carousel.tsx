'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './Carousel.module.css';

interface Slide {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  description: string;
}

interface CarouselProps {
  slides: Slide[];
  className?: string;
  slideWidth?: number;
  gap?: number;
  animationDuration?: number;
}

interface AnimationState {
  animationId: number;
  lastTime: number;
  baseElapsed: number; // auto-scroll elapsed time
  dragOffset: number; // current drag offset in pixels
  momentumVelocity: number; // px/ms for momentum
  isDragging: boolean;
  lastDragX: number;
  lastDragTime: number;
}

export default function Carousel({ 
  slides, 
  className = '', 
  slideWidth = 400,
  gap = 24,
  animationDuration = 20000
}: CarouselProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationState>({
    animationId: 0,
    lastTime: performance.now(),
    baseElapsed: 0,
    dragOffset: 0,
    momentumVelocity: 0,
    isDragging: false,
    lastDragX: 0,
    lastDragTime: 0,
  });

  const totalSlides = slides.length * 2;
  const trackWidth = (slideWidth + gap) * totalSlides;
  const animationDistance = (slideWidth + gap) * slides.length;
  const slideUnit = slideWidth + gap;

  const DRAG_SENSITIVITY = 1.0; // 1:1 direct drag
  const MOMENTUM_DECAY = 0.95;
  const MOMENTUM_THRESHOLD = 0.5;

  const applyTransform = (translateX: number) => {
    const track = trackRef.current;
    if (track) {
      track.style.transform = `translateX(${translateX}px)`;
    }
  };

  const getAutoScrollTranslateX = (elapsed: number) => {
    const progress = (elapsed % animationDuration) / animationDuration;
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
        // During drag: use base auto-scroll position + drag offset
        const autoTranslateX = getAutoScrollTranslateX(ref.baseElapsed);
        translateX = autoTranslateX + ref.dragOffset;
      } else if (Math.abs(ref.momentumVelocity) > MOMENTUM_THRESHOLD) {
        // Momentum phase: apply decaying velocity
        ref.baseElapsed += ref.momentumVelocity;
        ref.momentumVelocity *= MOMENTUM_DECAY;
        translateX = getAutoScrollTranslateX(ref.baseElapsed);
      } else {
        // Normal auto-scroll
        ref.baseElapsed += deltaTime;
        translateX = getAutoScrollTranslateX(ref.baseElapsed);
      }
      
      applyTransform(translateX);
      ref.animationId = requestAnimationFrame(animate);
    };

    ref.animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.animationId);
  }, [animationDuration, animationDistance, slides.length]);

  const handlePointerDown = (e: React.PointerEvent) => {
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
    
    // Update drag offset for direct manipulation
    ref.dragOffset += deltaX;
    
    // Calculate velocity for momentum (px/ms)
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
    
    // Apply drag offset to base elapsed so auto-scroll continues from new position
    const currentTranslateX = getAutoScrollTranslateX(ref.baseElapsed);
    const newTranslateX = currentTranslateX + ref.dragOffset;
    
    // Convert back to elapsed time
    const progress = -newTranslateX / animationDistance;
    ref.baseElapsed = (progress % 1 + 1) % 1 * animationDuration;
    ref.dragOffset = 0;
    
    ref.isDragging = false;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    const ref = animRef.current;
    if (!ref.isDragging) return;
    
    // Same as pointer up - commit drag offset and start momentum
    const currentTranslateX = getAutoScrollTranslateX(ref.baseElapsed);
    const newTranslateX = currentTranslateX + ref.dragOffset;
    const progress = -newTranslateX / animationDistance;
    ref.baseElapsed = (progress % 1 + 1) % 1 * animationDuration;
    ref.dragOffset = 0;
    
    ref.isDragging = false;
    setIsDragging(false);
  };

  const duplicatedSlides = [...slides, ...slides];

  return (
    <div
      className={`${styles.carousel} ${className}`}
      style={{ 
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      <div 
        ref={trackRef}
        className={styles.track}
        style={{
          width: `${trackWidth}px`,
          gap: `${gap}px`,
        } as React.CSSProperties}
      >
        {duplicatedSlides.map((slide, index) => (
          <div 
            key={index} 
            className={styles.slide}
            style={{ width: `${slideWidth}px`, flexShrink: 0 } as React.CSSProperties}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={slide.src}
                alt={slide.alt}
                width={slideWidth}
                height={384}
                className={styles.image}
                sizes={`${slideWidth}px`}
              />
              <div className={styles.gradientOverlay} />
            </div>
            <div className={styles.caption}>
              <p className={styles.subtitle}>{slide.subtitle}</p>
              <h2 className={styles.title}>{slide.title}</h2>
              <p className={styles.description}>{slide.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}