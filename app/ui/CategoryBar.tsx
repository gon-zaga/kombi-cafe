'use client'
import { useRouter } from "next/navigation";

const categories = [
  "All", "Kaffee", "Klassik Kaffee", "Specialty Kaffee", "Kaffee Frappe",
  "Non-Kaffee Latte", "Fruitee Latte", "The Beetles Juice",
  "Non-Kaffee Frappe", "Snacks",
];

function CategoryBar({ active, setActive }: { active: string; setActive: (c: string) => void }) {
  const router = useRouter();

  return (
    <section className="sticky top-0 z-20 w-full border-b border-dark-brown/20 bg-cream/95 text-dark-brown backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-2 sm:px-4">
        <button
          onClick={() => router.push('/order-queue')}
          className="flex min-h-[44px] shrink-0 items-center py-2"
        >
          <span className="whitespace-nowrap text-xs font-roboto-condensed tracking-wide text-dark-brown/70 hover:text-dark-brown sm:text-sm">
            Queue Display
          </span>
        </button>

        <div className="h-8 shrink-0 self-center border-l border-dark-brown/30" />

        <nav className="min-w-0 flex-1" aria-label="Menu categories">
          {/* Mobile: one scrolling row. md and up: wraps, so every category stays visible */}
          <ul className="flex flex-nowrap items-center gap-1.5 overflow-x-auto py-2 scrollbar-hide md:flex-wrap md:justify-center md:gap-2 md:overflow-visible">
            {categories.map((category) => (
              <li key={category} className="shrink-0">
                <button
                  onClick={() => setActive(category)}
                  aria-current={active === category ? "page" : undefined}
                  className={`flex min-h-[40px] items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-all duration-200 md:px-4 ${
                    active === category
                      ? "bg-dark-brown font-bold text-cream shadow-[0_2px_8px_rgba(61,43,31,0.3)]"
                      : "text-dark-brown/70 hover:bg-amber-100/50 hover:text-dark-brown"
                  }`}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

export default CategoryBar;