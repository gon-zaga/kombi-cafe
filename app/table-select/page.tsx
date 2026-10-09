'use client'

// Table picker: the customer taps the table they sit at, then goes to the menu
import { useRouter } from 'next/navigation';
import { useTableStore } from '@/store/TableStore';
import Header from '@/app/ui/Header';

const TOTAL_TABLES = 7;

export default function TableSelect() {
  const router = useRouter();
  const { setTable } = useTableStore();

  const handleSelect = (tableNumber: number) => {
    setTable(tableNumber);
    router.push('/menu');
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <h2 className="font-roboto-slab text-3xl text-dark-brown text-center mb-2">
          Select Your Table
        </h2>
        <p className="text-dark-brown/60 text-center mb-8">
          Tap the table you are sitting at to start ordering
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-2xl">
          {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => handleSelect(num)}
              className="bg-card-cream hover:bg-amber-100 border-2 border-dark-brown/20 hover:border-amber-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            >
              <span className="text-4xl font-roboto-slab font-bold text-dark-brown">{num}</span>
              <span className="text-xs font-roboto-condensed tracking-wide text-dark-brown/60">
                TABLE
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}