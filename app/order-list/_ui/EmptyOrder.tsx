"use client";

import { useRouter } from "next/navigation";

function EmptyOrder() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-dark-brown/40">
      <span className="text-6xl">🧾</span>
      <span className="text-2xl font-semibold tracking-wide">No orders yet</span>
      <span className="text-sm">Add something from the menu</span>
      <button
        onClick={() => router.push("/")}
        className="mt-2 px-5 py-2 rounded-full font-medium bg-dark-brown text-white cursor-pointer shadow-amber-50"
      >
        Browse Menu
      </button>
    </div>
  );
}

export default EmptyOrder;