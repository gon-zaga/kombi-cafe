'use client'

import Image from "next/image";
import { useState } from "react";
import SideNav from "./SideNav";

function Header() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <header className="shrink-0 flex flex-row items-center gap-3 text-white min-h-[64px] w-full bg-card-cream font-roboto-slab px-4 relative">
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open staff menu"
          aria-expanded={navOpen}
          className="
            flex flex-col justify-center items-center gap-1.25
            w-10 h-10 rounded-md shrink-0
            text-[#3B1F0E] hover:bg-[#E8D9B5]
            transition-colors duration-200
          "
        >
          <Image
            src="/brown-menu.svg"
            alt="brown-menu icon"
            height={24}
            width={24}
          />
        </button>

        <Image
          src="/transparent-logo-v1.svg"
          alt="KOMBI COFFEE"
          width={64}
          height={64}
          priority
          className="md:w-[74px] md:h-[74px]"
        />
        <span className="shrink-0 text-xl md:text-2xl text-dark-brown font-bold tracking-wider">
          KOMBI COFFEE
        </span>
      </header>

      <SideNav isOpen={navOpen} onClose={() => setNavOpen(false)} showQueueLink={true} />
    </>
  );
}

export default Header;