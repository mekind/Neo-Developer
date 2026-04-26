export type LpcAnimationName = `idle_${'n' | 's' | 'e' | 'w'}` | `walk_${'n' | 's' | 'e' | 'w'}`

export type LpcAnimationDefinition = {
  y: number
  frames: number[]
  fps: number
}

export type LpcFrameMap = {
  frameSize: number
  animations: Record<LpcAnimationName, LpcAnimationDefinition>
}

export type LpcState = {
  version: number
  bodyType?: string
  selections?: Record<string, unknown>
}

export type LpcSpriteBundle = {
  bundleId: string
  characterPngUrl: string
  frameMap: LpcFrameMap
  creditsText: string
  lpcState?: LpcState
}

export type LpcSpriteCatalog = Record<string, LpcSpriteBundle>

export const LOCAL_LPC_BUNDLE_IDS = ['cafe-bot'] as const
export const DEFAULT_LPC_BUNDLE_ID = 'cafe-bot'

const LOCAL_LPC_BASE_PATH = '/lpc-character-pipeline/.example'
const REQUIRED_ANIMATIONS: LpcAnimationName[] = ['idle_s', 'walk_s', 'idle_w', 'walk_w', 'idle_e', 'walk_e', 'idle_n', 'walk_n']

export function isLpcAnimationDefinition(value: unknown): value is LpcAnimationDefinition {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.y === 'number' && typeof candidate.fps === 'number' && Array.isArray(candidate.frames) && candidate.frames.every((frame) => typeof frame === 'number')
}

export function isLpcFrameMap(value: unknown): value is LpcFrameMap {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  const animations = candidate.animations
  if (typeof candidate.frameSize !== 'number' || typeof animations !== 'object' || animations === null) return false

  return REQUIRED_ANIMATIONS.every((name) => isLpcAnimationDefinition((animations as Record<string, unknown>)[name]))
}

export function isLpcState(value: unknown): value is LpcState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.version === 'number'
}

async function fetchJson(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`LPC asset request failed: ${response.status}`)
  return response.json()
}

async function fetchText(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`LPC asset request failed: ${response.status}`)
  return response.text()
}

export function getLocalLpcBundleBasePath(bundleId: string) {
  return `${LOCAL_LPC_BASE_PATH}/${bundleId}`
}

export function getLocalLpcCharacterPngUrl(bundleId: string) {
  return `${getLocalLpcBundleBasePath(bundleId)}/character.png`
}

export function resolveLpcBundleId(imageAsset: string | null | undefined) {
  const trimmed = imageAsset?.trim()
  if (!trimmed?.startsWith('lpc:')) return null
  const bundleId = trimmed.slice(4).trim()
  return bundleId || null
}

export async function loadLocalLpcSpriteBundle(bundleId: string): Promise<LpcSpriteBundle> {
  const basePath = getLocalLpcBundleBasePath(bundleId)
  const characterPngUrl = `${basePath}/character.png`
  const [frameMapPayload, creditsText, lpcStatePayload] = await Promise.all([
    fetchJson(`${basePath}/frame-map.json`),
    fetchText(`${basePath}/CREDITS.txt`),
    fetchJson(`${basePath}/lpc-state.json`).catch(() => null),
  ])

  if (!isLpcFrameMap(frameMapPayload)) {
    throw new Error(`Local LPC frame-map.json shape was invalid for bundle ${bundleId}.`)
  }

  if (!creditsText.trim()) {
    throw new Error(`Local LPC credits text was empty for bundle ${bundleId}.`)
  }

  return {
    bundleId,
    characterPngUrl,
    frameMap: frameMapPayload,
    creditsText,
    lpcState: isLpcState(lpcStatePayload) ? lpcStatePayload : undefined,
  }
}

export async function loadLocalLpcSpriteCatalog(bundleIds = [...LOCAL_LPC_BUNDLE_IDS]): Promise<LpcSpriteCatalog> {
  const bundles = await Promise.all(bundleIds.map((bundleId) => loadLocalLpcSpriteBundle(bundleId)))
  return Object.fromEntries(bundles.map((bundle) => [bundle.bundleId, bundle]))
}
