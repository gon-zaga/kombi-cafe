'use client'

// Polls /api/store-status so pages react when opening/closing time passes
import { useEffect, useState } from "react";
import type { StoreStatus } from "@/app/lib/storeHours";

export function useStoreStatus(enabled = true): StoreStatus | null {
  const [status, setStatus] = useState<StoreStatus | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/store-status", { cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data: StoreStatus = await res.json();
        if (mounted) setStatus(data);
      } catch (error) {
        console.error("Failed to load store status:", error);
      }
    }

    load();
    const interval = setInterval(load, 30 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [enabled]);

  return status;
}