"use client"
import Image from "next/image";

function ItemCard() {
  return (
    <section className="px-5 text-dark-brown grid grid-cols-2 gap-4">

      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <div key={item} className="bg-[#F4EBD0] rounded-2xl drop-shadow-lg flex flex-col p-3 gap-2">

          {/* Image + Add button */}
          <div className="relative flex justify-center items-center bg-white rounded-xl p-2">
            <Image
              src="/drinks/kaff-latte.png"
              alt="Kaffee latte"
              width={110}
              height={110}
            />
            <button className="absolute bottom-2 right-2">
              <Image
                src="/add-icon.svg"
                alt="add-btn"
                width={28}
                height={28}
              />
            </button>
          </div>

          {/* Price + Name */}
          <div className="flex flex-col items-start">
            <span className="font-bold text-lg">P60.00</span>
            <span className="font-medium text-sm">Kaffee Latte</span>
          </div>
          
        </div>
      ))}

    </section>
  );
}

export default ItemCard;