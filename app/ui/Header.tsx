import Image from "next/image";

function Header() {
  return (
    <div className="flex flex-row items-center gap-3 text-white h-10 w-full bg-dark-brown font-roboto-slab px-4">
      <Image
        src="/kombi-logo.png"
        alt="KOMBI COFFEE"
        width={32}
        height={32}
        priority                  // Critical for header logo (loads immediately)
      />
      <span className="text-lg font-bold tracking-wider">KOMBI COFFEE</span>
    </div>
  );
}

export default Header;