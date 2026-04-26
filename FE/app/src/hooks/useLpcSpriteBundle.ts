import { useEffect, useState } from 'react'

import { loadLocalLpcSpriteCatalog, type LpcSpriteCatalog } from '@/game/lpcSprite'

export function useLpcSpriteBundle() {
  const [catalog, setCatalog] = useState<LpcSpriteCatalog>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadBundle() {
      try {
        setErrorMessage(null)
        const nextCatalog = await loadLocalLpcSpriteCatalog()
        if (!isMounted) return
        setCatalog(nextCatalog)
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
    catalog,
    creditsText: Object.values(catalog)
      .map((bundle) => `# ${bundle.bundleId}\n${bundle.creditsText}`)
      .join('\n\n'),
    errorMessage,
  }
}
