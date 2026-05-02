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

  return(
    <>
      <section className="text-dark-brown">
        <hr className="border-dark-brown"/>
        <div className="w-full flex items-center">
          <button onClick={() => router.push('/order-queue')}>
            <section className="flex flex-col justify-center items-center p-1 gap-0.5 shrink-0">
            <span className="text-xs">Queue Display</span>
           </section>
          </button>
          {/*VERTICAL DIVIDER*/}
          <div className="h-10 flex border-l border-dark-brown mx-2.5 shrink-0"></div>
          <section className="flex overflow-x-auto scrollbar-hide">
            <ul className="flex flex-row gap-3"> 
              {categories.map((category) => (
                // Show each category in list item
                <li key={category}>
                  <button
                    onClick={() => setActive(category)}
                    className={`whitespace-nowrap pb-1 border-b-2 transition-all
                      // If that category is selected make it bolder 
                      ${active === category
                        ? "border-dark-brown font-bold"
                        : "border-transparent"
                      }`}
                  >
                    {/*The Categories*/}
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <hr className="border-dark-brown"/>
      </section>
  </>
  );
}

export default CategoryBar;