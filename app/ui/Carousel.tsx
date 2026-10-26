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
  baseElapsed: number;
  dragOffset: number;
  momentumVelocity: number;
  isDragging: boolean;
  lastDragX: number;
  lastDragTime: number;
}

export default function Carousel({ 
  slides, 
  className = '', 
  gap = 24,
  animationDuration = 20000
}: CarouselProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
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

  // Responsive slide width: 90% of viewport on mobile, up to 400px on desktop
  const slideWidth = Math.min(
    typeof window !== 'undefined' ? window.innerWidth * 0.9 : 400,
    400
  );

  const totalSlides = slides.length * 2;
  const trackWidth = (slideWidth + gap) * totalSlides;
  const animationDistance = (slideWidth + gap) * slides.length;
  const slideUnit = slideWidth + gap;

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
    ref.baseElapsed = (progress % 1 + 1) % 1 * animationDuration;
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
    ref.baseElapsed = (progress % 1 + 1) % 1 * animationDuration;
    ref.dragOffset = 0;
    
    ref.isDragging = false;
    setIsDragging(false);
  };

  // Update slide dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-render by updating a state if needed
      // The slideWidth is calculated during render
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const duplicatedSlides = [...slides, ...slides];
  // Responsive height: maintain 16:9 aspect ratio on mobile, fixed 384px on larger screens
  const carouselHeight = typeof window !== 'undefined' && window.innerWidth < 640 
    ? slideWidth * 0.96 // ~16:9 ratio
    : 384;

  return (
    <div
      ref={carouselRef}
      className={`${styles.carousel} ${className}`}
      style={{ 
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        height: `${carouselHeight}px`
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
                width={Math.round(slideWidth)}
                height={Math.round(carouselHeight)}
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