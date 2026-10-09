'use client'

// Checks the store hours at click time: open -> table select, closed -> popup
import { useState } from "react";
import { useRouter } from "next/navigation";
import StoreClosedModal from "./StoreClosedModal";
import type { StoreStatus } from "@/app/lib/storeHours";

export default function OrderNowButton({
  className = "bg-dark-brown text-white px-8 py-4 rounded-2xl text-lg font-semibold",
  children = "Order Now",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [closedStatus, setClosedStatus] = useState<StoreStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const handleClick = async () => {
    setChecking(true);
    try {
      // Fresh check on every click, so a tab left open can't act on stale hours
      const res = await fetch("/api/store-status", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const status: StoreStatus = await res.json();

      if (status.isOpen) router.push("/table-select");
      else setClosedStatus(status);
    } catch (error) {
      console.error("Failed to check store status:", error);
      // Can't tell: let them through; StoreGate and the orders API still enforce closing
      router.push("/table-select");
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <button onClick={handleClick} disabled={checking} className={`${className} disabled:opacity-60`}>
        {checking ? "Checking..." : children}
      </button>
      <StoreClosedModal status={closedStatus} onClose={() => setClosedStatus(null)} />
    </>
  );
}