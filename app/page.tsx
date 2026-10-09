'use client';

import OrderNowButton from '@/app/ui/OrderNowButton';
import Header from '@/app/ui/Header';

export default function HomePage() {
  return (
    <div className="bg-cream min-h-screen flex flex-col items-center justify-start">
      <div className="w-full">
        <Header />
      </div>

      <h1 className="font-roboto-slab text-3xl text-center mt-0 mb-6">
        Kombi Cafe
      </h1>

      <OrderNowButton
        className="bg-dark-brown text-white px-8 py-4 rounded-2xl text-lg font-semibold"
      />
    </div>
  );
}
