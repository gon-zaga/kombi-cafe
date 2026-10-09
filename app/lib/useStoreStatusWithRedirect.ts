'use client'

import { useEffect } from 'react'
import { useStoreStatus } from '@/app/lib/useStoreStatus'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

// Same list as in StoreGate.tsx – keep it in one place
const GATED_PATHS = [/^\/menu/, /^\/table-select/, /^\/orders(\/|$)/, /^\/order-list/]

export function useStoreStatusWithRedirect(enabled = true) {
  const status = useStoreStatus(enabled)
  const router = useRouter()
  const pathname = usePathname()
  const gated = GATED_PATHS.some((re) => re.test(pathname))

  useEffect(() => {
    if (!enabled || !gated || !status) return
    if (!status.isOpen) {
      // Redirect to home; replace history so back‑button doesn’t return to a blocked page
      router.replace('/')
    }
  }, [status, enabled, gated, router])

  return status
}