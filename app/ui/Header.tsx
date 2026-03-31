import Image from "next/image";

function Header() {
  return (
    <div className="flex flex-row items-center gap-3 text-white h-18 w-full bg-[#F4EBD0] font-roboto-slab px-4">
      <Image
        src="/transparent-kombi-logo.svg"
        alt="KOMBI COFFEE"
        width={60}
        height={60}
        priority                  // Critical for header logo (loads immediately)
      />
      <span className=" shrink-0 text-4xl text-dark-brown font-bold tracking-wider">KOMBI COFFEE</span>
    </div>
  );
}

export default Header;