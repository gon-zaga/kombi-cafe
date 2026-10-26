'use client'
import { useRouter } from "next/navigation";


function CategoryBar({active,   setActive}: {active: string, setActive: (category: string) => void}) {
  const router = useRouter();
  const categories = [
    "All",
    "Kaffee",
    "Klassik Kaffee",
    "Specialty Kaffee",
    "Kaffee Frappe",
    "Non-Kaffee Latte",
    "Fruitee Latte",
    "The Beetles Juice", 
    "Non-Kaffee Frappe",
    "Snacks"
  ];

  return (
    <div>
      <section className="text-dark-brown sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-dark-brown/20">
        <div className="w-full flex items-center">
          <button onClick={() => router.push('/order-queue')} className="shrink-0 flex flex-col justify-center items-center p-2 gap-0.5 min-h-[44px] min-w-[44px]">
            <span className="text-xs font-roboto-condensed tracking-wide text-dark-brown/70 hover:text-dark-brown transition-colors whitespace-nowrap">
              Queue Display
            </span>
          </button>
          {/* VERTICAL DIVIDER */}
          <div className="h-10 flex border-l border-dark-brown/30 mx-2.5 shrink-0"></div>
          <section className="flex-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2" role="navigation" aria-label="Menu categories">
            <ul className="flex flex-row gap-2 px-2 snap-nones"> 
              {categories.map((category) => (
                <li key={category}>
                  <button
                    onClick={() => setActive(category)}
                    className={`whitespace-nowrap px-4 py-2.5 rounded-lg transition-all duration-200 snap-center min-h-[44px] flex items-center
                      ${active === category
                        ? "bg-dark-brown text-cream font-bold shadow-[0_2px_8px_rgba(61,43,31,0.3)]"
                        : "text-dark-brown/70 hover:text-dark-brown hover:bg-amber-100/50"
                      }`}
                    aria-current={active === category ? "page" : undefined}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}

export default CategoryBar;