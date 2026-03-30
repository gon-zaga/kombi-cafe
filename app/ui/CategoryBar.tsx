'use client'
import Image from "next/image";

function CategoryBar({active,   setActive}: {active: string, setActive: (category: string) => void}) {
  const categories = [
    "Kaffee",
    "Klassik Kaffee",
    "Specialty Kaffee",
    "Kaffee Frappe",
    "Non-Kaffe Latte",
    "Fruitte Latte",
    "The Beetles Juice", 
    "Non-Kaffee Frappe",
    "Snacks"
  ];

  return(
    <>
      <section className="text-dark-brown">
        <hr className="border-dark-brown"/>
        <div className="w-full flex items-center">
          <section className="flex flex-row p-1 gap-0.5 shrink-0">
            <Image 
              src="/search-icon.svg"
              alt="search-bar"
              width={32}
              height={32}
            />
            <Image
              src="/bullet-list.svg"
              alt="bullet-list-icon"
              width={32}
              height={32}
            />
          </section>
          {/*VERTICAL DIVIDER*/}
          <div className="h-10 flex border-l border-dark-brown mx-2.5 shrink-0"></div>
          <section className="flex overflow-x-auto scrollbar-hide">
            <ul className="flex flex-row gap-3"> 
              {categories.map((category) => (
                <li key={category}>
                  <button
                    onClick={() => setActive(category)}
                    className={`whitespace-nowrap pb-1 border-b-2 transition-all
                      ${active === category
                        ? "border-dark-brown font-bold"
                        : "border-transparent"
                      }`}
                  >
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