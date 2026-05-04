'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import OwnerSideNav from "./OwnerSideNav";

interface OwnerHeaderProps {
  title: string
}

function OwnerHeader({ title }: OwnerHeaderProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');
  const router = useRouter();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }));
      setDateString(now.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="flex flex-col">
      <header className="flex justify-between items-center bg-dark-brown text-white p-3 mb-8">
        <div className="flex items-center gap-2">
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
            <span className="text-sm">{timeString} - {dateString}</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          Logout
        </button>
      </header>
      <OwnerSideNav isOpen={navOpen} onClose={() => setNavOpen(false)} />
    </section>
  );
}

export default OwnerHeader;