'use client';

import OrderNowButton from '@/app/ui/OrderNowButton';
import Header from '@/app/ui/Header';

export default function HomePage() {
  return (
    <div className="bg-cream min-h-screen flex flex-col items-center justify-start">
      {/* Header */}
      <div className="w-full">
        <Header />
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

      {/* Featured Drinks - Compact Vertical Layout */}
      <section className="w-full max-w-2xl mx-auto px-4 md:px-6 mb-6">
        <div className="flex flex-col gap-4">

          {/* Featured Drink 1 */}
          <div className="group relative overflow-hidden rounded-2xl shadow-md h-64 sm:h-72 md:h-80 bg-[#E8D9B8]">
            <img
              src="/promotions-drink.jpg"
              alt="Signature coffee"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <div className="absolute bottom-0 left-0 p-4 md:p-5 text-white">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] mb-1 text-white/80">
                Customer Favorite
              </p>

              <h2 className="font-roboto-slab text-xl md:text-2xl font-bold">
                Signature Coffee
              </h2>

              <p className="mt-1 text-xs md:text-sm text-white/90">
                Rich flavors, crafted just for you.
              </p>
            </div>
          </div>

          {/* Featured Drink 2 */}
          <div className="group relative overflow-hidden rounded-2xl shadow-md h-64 sm:h-72 md:h-80 bg-[#E8D9B8]">
            <img
              src="/promotion-snacks.jpg"
              alt="Featured cafe snacks"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <div className="absolute bottom-0 left-0 p-4 md:p-5 text-white">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] mb-1 text-white/80">
                Made with Care
              </p>

              <h2 className="font-roboto-slab text-xl md:text-2xl font-bold">
                Cafe Snacks
              </h2>

              <p className="mt-1 text-xs md:text-sm text-white/90">
                Your next coffee break starts here.
              </p>
            </div>
          </div>

        </div>
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
