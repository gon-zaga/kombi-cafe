'use client';

// Blocks customer ordering pages when the store is closed or the system is down.
// Staff areas, order confirmation, and the queue board remain accessible.

import { usePathname } from "next/navigation";
import { useStoreStatus } from "@/app/lib/useStoreStatus";
import { resolveSystemDownMessage } from "@/app/lib/systemDown";

const GATED_PATHS = [
  /^\/menu/,
  /^\/table-select/,
  /^\/orders(\/|$)/,
  /^\/order-list/,
];

export default function StoreGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const gated = GATED_PATHS.some((re) => re.test(pathname));
  const status = useStoreStatus(gated);

  if (!gated) return <>{children}</>;

  if (status === null) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-800 border-t-transparent" />
        <p className="mt-4 text-dark-brown">
          Checking store status...
        </p>
      </div>
    );
  }

  if (!status.isOpen) {
    const down = status.systemDown;

    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <h2 className="font-roboto-slab text-5xl text-dark-brown font-bold mb-4">
          {down ? "SYSTEM NOTICE" : "STORE CLOSED"}
        </h2>

        {down ? (
          <div className="bg-white/40 rounded-xl px-6 py-4 text-dark-brown/80 whitespace-pre-line max-w-2xl">
            {resolveSystemDownMessage(status.systemDownMessage)}
          </div>
        ) : (
          <>
            <p className="text-dark-brown/60 text-xl mb-6">
              We&apos;re currently closed. Please come back during our opening hours.
            </p>

            <div className="bg-white/40 rounded-xl px-6 py-4 text-dark-brown/80">
              Opening hours: {status.openingTime} - {status.closingTime}
            </div>
          </>
        )}

        {down && (
          <div className="mt-4 text-xs text-dark-brown/60">
            Normal hours: {status.openingTime} - {status.closingTime}
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
