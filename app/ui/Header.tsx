'use client'

import Image from "next/image";
import { useState } from "react";
import SideNav from "./SideNav";

function Header() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <header className="shrink-0 flex flex-row items-center gap-3 text-white h-18 w-full bg-card-cream font-roboto-slab px-4 relative">

        {/* ── Hamburger ───────────────────────────────────────────────────── */}
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open staff menu"
          aria-expanded={navOpen}
          className="
            flex flex-col justify-center items-center gap-1.25
            w-9 h-9 rounded-md shrink-0
            text-[#3B1F0E] hover:bg-[#E8D9B5]
            transition-colors duration-200
          "
        >
        <Image 
          src="\brown-menu.svg"
          alt="brown-menu icon"
          height={28}
          width={28 }
        /> 
        </button>

        {/* ── Logo + name ─────────────────────────────────────────────────── */}
        <Image
          src="/transparent-logo-v1.svg"
          alt="KOMBI COFFEE"
          width={74}
          height={74}
          priority
        />
        <span className="shrink-0 text-2xl text-dark-brown font-bold tracking-wider">
          KOMBI COFFEE
        </span>
      </header>

      <SideNav isOpen={navOpen} onClose={() => setNavOpen(false)} />
    </>
  );
}

export default Header;