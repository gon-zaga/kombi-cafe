'use client'
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

function ConfirmOrder() {
  const confirmParam = useSearchParams();
  const ref = confirmParam.get('ref');
  const total = confirmParam.get('total');

  return (
    <section className="bg-cream flex min-h-screen items-center justify-center">
      {/* Confirm Card */}
      <div className="flex flex-col items-center justify-center w-4/5 gap-2">
        <Image
          src="/check-circle.svg"
          alt="check-icon"
          width={48}
          height={48}
        />
        <span className="font-mono text-sm tracking-widest text-dark-brown">ORDER PLACED</span>
        <span className="text-2xl font-semibold">You&#39;re all set!</span>

        <div className="mt-3 bg-dark-brown text-white py-4 px-8 rounded-2xl text-center w-full">
          <span className="text-sm tracking-widest font-mono">REFERENCE NUMBER</span>
          <p className="text-3xl font-bold font-mono mt-1">{ref}</p>
        </div>

        <hr className="w-full border-dark-brown/20 my-2" />

        <span className="text-lg font-medium">
          Total Paid: ₱{Number(total).toFixed(2)}
        </span>
      </div>
    </section>
  );
}

export default function ConfirmOrderPage() {
  return ( 
    <Suspense>  
      <ConfirmOrder />
    </Suspense>
  );
}