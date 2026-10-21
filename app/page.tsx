'use client';

import HomeHeader from '@/app/ui/HomeHeader';
import OrderNowButton from '@/app/ui/OrderNowButton';
import Carousel from '@/app/ui/Carousel';

interface Slide {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  description: string;
}

const slides: Slide[] = [
  {
    src: '/promotions-drink.jpg',
    alt: 'Signature coffee',
    title: 'Signature Coffee',
    subtitle: 'Customer Favorite',
    description: 'Rich flavors, crafted just for you.'
  },
  {
    src: '/promotion-snacks.jpg',
    alt: 'Featured cafe snacks',
    title: 'Cafe Snacks',
    subtitle: 'Made with Care',
    description: 'Your next coffee break starts here.'
  },
  {
    src: '/cold.jpg',
    alt: 'Cold brew selection',
    title: 'Cold Brew',
    subtitle: 'Refreshingly Smooth',
    description: 'Steeped for perfect flavor.'
  },
  {
    src: '/piza.jpg',
    alt: 'Fresh from the oven',
    title: 'Fresh Pastries',
    subtitle: 'Cooked Daily',
    description: 'Pizza and more.'
  },
];

export default function HomePage() {
  return (
    <div className="bg-cream min-h-screen flex flex-col items-center justify-start">
      {/* Header */}
      <div className="w-full">
        <HomeHeader />
      </div>

      {/* Homepage Title */}
      <section className="w-full text-center px-4 pt-5 pb-4">
        <h1 className="font-roboto-slab text-2xl md:text-4xl font-bold text-dark-brown mb-2">
          Kombi Cafe
        </h1>

        <p className="text-dark-brown/70 text-xs md:text-sm">
          Your favorite coffee, made for every moment.
        </p>
      </section>

      {/* Featured Drinks - Carousel */}
      <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6 mb-6">
        <Carousel slides={slides} />
      </section>

      {/* Order Button */}
      <div className="flex justify-center pb-8">
        <OrderNowButton
          className="bg-dark-brown text-white px-6 py-3 rounded-xl text-sm md:text-base font-semibold shadow-md hover:opacity-90 transition-opacity"
        />
      </div>
    </div>
  );
}
