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
  characterPngUrl: string
  frameMap: LpcFrameMap
  creditsText: string
  lpcState?: LpcState
  sheetWidth: number
  sheetHeight: number
}

const LOCAL_LPC_BASE_PATH = '/lpc-character-pipeline/.example/cafe-bot'

const REQUIRED_ANIMATIONS: LpcAnimationName[] = ['idle_s', 'walk_s', 'idle_w', 'walk_w', 'idle_e', 'walk_e', 'idle_n', 'walk_n']

function isAnimationDefinition(value: unknown): value is LpcAnimationDefinition {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.y === 'number' && typeof candidate.fps === 'number' && Array.isArray(candidate.frames) && candidate.frames.every((frame) => typeof frame === 'number')
}

function isFrameMap(value: unknown): value is LpcFrameMap {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  const animations = candidate.animations
  if (typeof candidate.frameSize !== 'number' || typeof animations !== 'object' || animations === null) return false

  return REQUIRED_ANIMATIONS.every((name) => isAnimationDefinition((animations as Record<string, unknown>)[name]))
}

function isLpcState(value: unknown): value is LpcState {
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

async function measureImage(url: string) {
  return await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Failed to load local LPC character.png'))
    image.src = url
  })
}

export async function loadLocalLpcSpriteBundle(): Promise<LpcSpriteBundle> {
  const characterPngUrl = `${LOCAL_LPC_BASE_PATH}/character.png`
  const [frameMapPayload, creditsText, lpcStatePayload, sheetSize] = await Promise.all([
    fetchJson(`${LOCAL_LPC_BASE_PATH}/frame-map.json`),
    fetchText(`${LOCAL_LPC_BASE_PATH}/CREDITS.txt`),
    fetchJson(`${LOCAL_LPC_BASE_PATH}/lpc-state.json`).catch(() => null),
    measureImage(characterPngUrl),
  ])

  if (!isFrameMap(frameMapPayload)) {
    throw new Error('Local LPC frame-map.json shape was invalid.')
  }

  if (!creditsText.trim()) {
    throw new Error('Local LPC credits text was empty.')
  }

  return {
    characterPngUrl,
    frameMap: frameMapPayload,
    creditsText,
    lpcState: isLpcState(lpcStatePayload) ? lpcStatePayload : undefined,
    sheetWidth: sheetSize.width,
    sheetHeight: sheetSize.height,
  }
}
