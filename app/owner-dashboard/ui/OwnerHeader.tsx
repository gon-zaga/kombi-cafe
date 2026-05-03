'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import OwnerSideNav from "./OwnerSideNav";

interface OwnerHeaderProps {
  title: string 
}
function OwnerHeader({title}: OwnerHeaderProps){
  const [currentTime, setCurrentTime] = useState(new Date());
  const  [navOpen, setNavOpen] = useState(false);

  // update every second with useEffect

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)  // Update every second
    return () => clearInterval(interval);
  }, [])

  // format time and date then display
  const timeString = currentTime.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12:true 
  })

  const dateString = currentTime.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return( 
    <section className="flex flex-col ">
      <header className="flex bg-dark-brown text-white p-3 mb-8">
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open Side Nav"
          aria-expanded={navOpen}
          className="flex flex-col justify-center items-center gap-1.25
            w-9 h-9 rounded-md shrink-0
            text-[#3B1F0E] hover:bg-[#E8D9B5]
            transition-colors duration-200"
        >
            <Image 
              src="/white-menu.svg"
              alt="white-menu"
              width={32}
              height={32}
            
            />
            </button>
        <div className="flex flex-col">
          <span className="font-roboto-condensed font-bold">{title}</span>
          <span>{timeString} - {dateString}</span>
        </div>
      </header>
        <OwnerSideNav isOpen={navOpen} onClose={() => setNavOpen(false)}/>
    </section>
  );
}

export default OwnerHeader