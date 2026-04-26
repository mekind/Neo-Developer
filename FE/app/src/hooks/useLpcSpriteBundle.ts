import { useEffect, useState } from 'react'

import { loadLocalLpcSpriteBundle, type LpcSpriteBundle } from '@/game/lpcSprite'

export function useLpcSpriteBundle() {
  const [bundle, setBundle] = useState<LpcSpriteBundle | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadBundle() {
      try {
        setErrorMessage(null)
        const nextBundle = await loadLocalLpcSpriteBundle()
        if (!isMounted) return
        setBundle(nextBundle)
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load local LPC sprite bundle.')
      }
    }

    void loadBundle()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    bundle,
    errorMessage,
  }
}
