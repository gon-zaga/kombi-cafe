import Image from "next/image";

function Header() {
  return (
    <div className="shrink-0 flex flex-row items-center gap-3 text-white h-18 w-full bg-[#F4EBD0] font-roboto-slab px-4">
      <Image
        src="/transparent-logo-v1.svg"
        alt="KOMBI COFFEE"
        width={74}
        height={74}
        priority                  // Critical for header logo (loads immediately)
      />
      <span className=" shrink-0 text-4xl text-dark-brown font-bold tracking-wider">KOMBI COFFEE</span>
    </div>
  );
}

export default Header;