'use client';

import { useStoreStatusWithRedirect } from "@/app/lib/useStoreStatusWithRedirect";

export default function StoreStatusRedirectClient() {
  useStoreStatusWithRedirect();
  return null;
}