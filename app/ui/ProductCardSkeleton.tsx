'use client';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-[#F4EBD0] rounded-2xl drop-shadow-lg flex flex-col p-3 gap-2 text-dark-brown animate-pulse">
      <div className="flex justify-center items-center bg-white/50 rounded-xl p-2 w-full aspect-[5/7] shrink-0">
        <div className="w-full h-full rounded-lg bg-dark-brown/10" />
      </div>

      <div className="flex flex-col items-start gap-1.5 w-full">
        <div className="flex flex-wrap gap-1.5 w-full">
          <div className="h-6 w-20 rounded-full bg-dark-brown/10" />
          <div className="h-6 w-24 rounded-full bg-dark-brown/10" />
        </div>

        <div className="h-5 w-3/4 rounded bg-dark-brown/10" />
        <div className="h-4 w-1/2 rounded bg-dark-brown/10" />
        <div className="h-3 w-1/3 rounded bg-dark-brown/10" />

        <div className="mt-2 w-full border-t border-[#D8C7A5] pt-2">
          <div className="h-3 w-24 rounded bg-dark-brown/10 mb-1.5" />
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 w-16 rounded-full bg-dark-brown/10" />
            <div className="h-5 w-20 rounded-full bg-dark-brown/10" />
            <div className="h-5 w-18 rounded-full bg-dark-brown/10" />
          </div>
        </div>
      </div>
    </div>
  );
}