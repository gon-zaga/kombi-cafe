'use client'

// Blocks every customer page with a STORE CLOSED screen outside opening hours.
// Staff areas (login, barista, owner), order confirmation and the queue board stay open.
import { usePathname } from "next/navigation";
import { useStoreStatus } from "@/app/lib/useStoreStatus";

const GATED_PATHS = [/^\/menu/, /^\/table-select/, /^\/orders(\/|$)/, /^\/order-list/];

export default function StoreGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const gated = GATED_PATHS.some((re) => re.test(pathname));
  const status = useStoreStatus(gated);

  if (!gated) return <>{children}</>;

  if (status === null) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-800 border-t-transparent" />
        <p className="mt-4 text-dark-brown">Checking store status...</p>
      </div>
    );
  }

   if (!status.isOpen) {
     // If system down is active, check for custom message
     if (status.systemDown) {
       if (status.systemDownMessage !== undefined && status.systemDownMessage !== null && status.systemDownMessage !== "") {
         // Custom system down message provided
         return (
           <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
             <h2 className="font-roboto-slab text-5xl text-dark-brown font-bold mb-4">
               SYSTEM NOTICE
             </h2>
             <div className="bg-white/40 rounded-xl px-6 py-4 text-dark-brown/80">
               {status.systemDownMessage}
             </div>
             <div className="mt-4 text-xs text-dark-brown/60">
               {status.openingTime && status.closingTime && (
                 <>
                   Normal hours: {status.openingTime} - {status.closingTime}
                 </>
               )}
             </div>
           </div>
         );
       } else {
         // System down is active but no custom message - use default system down message
         return (
           <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
             <h2 className="font-roboto-slab text-5xl text-dark-brown font-bold mb-4">
               SYSTEM NOTICE
             </h2>
             <div className="bg-white/40 rounded-xl px-6 py-4 text-dark-brown/80">
               The ordering management system is down for a moment!
               We are working to bring it back online as quickly as possible.
               To place your order: Please see a staff member at the counter.
               They are ready to take your order manually!
             </div>
             <div className="mt-4 text-xs text-dark-brown/60">
               {status.openingTime && status.closingTime && (
                 <>
                   Normal hours: {status.openingTime} - {status.closingTime}
                 </>
               )}
             </div>
           </div>
         );
       }
     }
     
     // Regular closed mode (not system down)
     return (
       <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
         <h2 className="font-roboto-slab text-5xl text-dark-brown font-bold mb-4">
           STORE CLOSED
         </h2>
         <p className="text-dark-brown/60 text-xl mb-6">
           We&apos;re currently closed. Please come back during our opening hours.
         </p>
         <div className="bg-white/40 rounded-xl px-6 py-4 text-dark-brown/80">
           Opening hours: {status.openingTime} - {status.closingTime}
         </div>
       </div>
     );
   }

  return <>{children}</>;
}