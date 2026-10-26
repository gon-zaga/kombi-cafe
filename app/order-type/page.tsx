'use client'

// Order type selection: Dine-in or Takeout
import { useRouter } from 'next/navigation';
import { useOrderTypeStore } from '@/store/OrderTypeStore';
import Header from '@/app/ui/Header';

export default function OrderTypePage() {
  const router = useRouter();
  const { setOrderType } = useOrderTypeStore();

  const handleSelect = (type: 'dine_in' | 'takeout') => {
    setOrderType(type);
    if (type === 'dine_in') {
      router.push('/table-select');
    } else {
      router.push('/menu');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <h2 className="font-roboto-slab text-3xl text-dark-brown text-center mb-2">
          How would you like to order?
        </h2>
        <p className="text-dark-brown/60 text-center mb-8">
          Choose dine-in to enjoy your drink at our cafe, or takeout to grab and go
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
          <button
            onClick={() => handleSelect('dine_in')}
            className="bg-white hover:bg-amber-50 border-2 border-dark-brown/20 hover:border-amber-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-200 active:scale-95"
          >
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xl font-roboto-slab font-bold text-dark-brown">Dine In</span>
            <p className="text-sm text-dark-brown/60 text-center">Enjoy your drink at a table</p>
          </button>

          <button
            onClick={() => handleSelect('takeout')}
            className="bg-white hover:bg-amber-50 border-2 border-dark-brown/20 hover:border-amber-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-200 active:scale-95"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v4m2 0l4 4m-4-4h14l-5 5M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-roboto-slab font-bold text-dark-brown">Takeout</span>
            <p className="text-sm text-dark-brown/60 text-center">Grab your order and go</p>
          </button>
        </div>
      </div>
    </div>
  );
}