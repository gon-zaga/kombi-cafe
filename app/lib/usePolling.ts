'use client'

import { useEffect, useRef } from 'react'

export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs = 5000,
  enabled = true
) {
  const saved = useRef(callback)

  useEffect(() => {
    saved.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const run = () => {
      if (document.visibilityState === 'visible') void saved.current()
    }

    run()
    const id = setInterval(run, intervalMs)
    document.addEventListener('visibilitychange', run)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', run)
    }
  }, [intervalMs, enabled])
}