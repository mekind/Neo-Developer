import {
  DEFAULT_LPC_BUNDLE_ID,
  getLocalLpcCharacterPngUrl,
  isLpcFrameMap,
  isLpcState,
  resolveLpcBundleId,
  type LpcFrameMap,
  type LpcState,
} from './lpcSprite'

export interface BackendAgentRecord {
  id: string
  name?: string
  imageAsset?: string | null
  characterPngUrl?: string | null
  frameMap?: LpcFrameMap | null
  creditsText?: string | null
  lpcState?: LpcState | null
}

export interface CreatedAgentRecord {
  id: string
  name: string
  archetype?: 'scout' | 'maker' | 'spark'
  personaSummary?: string
  backstoryPrompt?: string
  createdAt?: string
}

export interface WorldAgent {
  id: string
  label: string
  imageSrc: string
  usesPlaceholder: boolean
  spriteBundleId: string | null
  apiSprite: {
    bundleKey: string
    characterPngUrl: string
    frameMap: LpcFrameMap
    creditsText: string
    lpcState?: LpcState
  } | null
  xPercent: number
  yPercent: number
}

export interface WorldPlayer {
  id: string
  label: string
  imageSrc: string
  spriteBundleId: string
  xPercent: number
  yPercent: number
}

export const PLAYER_STEP_PERCENT = 3
export const INTERACTION_RADIUS_PERCENT = 10

function createAvatarDataUri(options: { fill: string; accent: string; label: string; initials: string }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${options.label}">
      <rect width="96" height="96" rx="24" fill="${options.fill}" />
      <circle cx="48" cy="30" r="15" fill="#f8fafc" />
      <path d="M26 78c3-15 12-24 22-24 11 0 20 9 22 24" fill="#f8fafc" />
      <circle cx="42" cy="28" r="2.5" fill="${options.accent}" />
      <circle cx="54" cy="28" r="2.5" fill="${options.accent}" />
      <path d="M40 38c2 3 5 4 8 4s6-1 8-4" stroke="${options.accent}" stroke-width="3" stroke-linecap="round" fill="none" />
      <text x="48" y="89" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#f8fafc">${options.initials}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function createPlaceholderPersonIcon(): string {
  return createAvatarDataUri({
    fill: '#fde68a',
    accent: '#7c5a3c',
    label: 'placeholder person avatar',
    initials: 'NPC',
  })
}

export const PLACEHOLDER_AGENT_IMAGE = createPlaceholderPersonIcon()

export const PLAYER_IMAGE = createAvatarDataUri({
  fill: '#22c55e',
  accent: '#14532d',
  label: 'user player avatar',
  initials: 'YOU',
})

const DEFAULT_DUMMY_AGENT: BackendAgentRecord = {
  id: 'dummy-agent-noa',
  name: 'Noa',
  imageAsset: `lpc:${DEFAULT_LPC_BUNDLE_ID}`,
}

const LOCAL_LPC_AGENT_BUNDLE_BY_ID: Record<string, string> = {
  'dummy-agent-noa': DEFAULT_LPC_BUNDLE_ID,
  'dummy-haru': DEFAULT_LPC_BUNDLE_ID,
  'dummy-miso': DEFAULT_LPC_BUNDLE_ID,
}

function isAllowedImageAsset(value: string) {
  return value.startsWith('data:image/') || value.startsWith('https://')
}

function resolveApiSprite(record: BackendAgentRecord) {
  const characterPngUrl = record.characterPngUrl?.trim()
  const creditsText = record.creditsText?.trim()

  if (!characterPngUrl || !creditsText || !isLpcFrameMap(record.frameMap)) return null

  return {
    bundleKey: `api-agent-${record.id}`,
    characterPngUrl,
    frameMap: record.frameMap,
    creditsText,
    lpcState: isLpcState(record.lpcState) ? record.lpcState : undefined,
  }
}

function resolveAgentImage(record: BackendAgentRecord) {
  const apiSprite = resolveApiSprite(record)
  if (apiSprite) {
    return {
      imageSrc: apiSprite.characterPngUrl,
      usesPlaceholder: false,
      spriteBundleId: null,
      apiSprite,
    }
  }

  const spriteBundleId = resolveLpcBundleId(record.imageAsset) ?? LOCAL_LPC_AGENT_BUNDLE_BY_ID[record.id] ?? DEFAULT_LPC_BUNDLE_ID
  if (spriteBundleId) {
    return {
      imageSrc: getLocalLpcCharacterPngUrl(spriteBundleId),
      usesPlaceholder: false,
      spriteBundleId,
      apiSprite: null,
    }
  }

  const trimmed = record.imageAsset?.trim()
  if (!trimmed || !isAllowedImageAsset(trimmed)) {
    return {
      imageSrc: PLACEHOLDER_AGENT_IMAGE,
      usesPlaceholder: true,
      spriteBundleId: null,
      apiSprite: null,
    }
  }

  return {
    imageSrc: trimmed,
    usesPlaceholder: false,
    spriteBundleId: null,
    apiSprite: null,
  }
}

function randomPercent(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export function measurePercentDistance(
  a: { xPercent: number; yPercent: number },
  b: { xPercent: number; yPercent: number },
) {
  return Math.hypot(a.xPercent - b.xPercent, a.yPercent - b.yPercent)
}

function nextPosition(existing: Array<{ xPercent: number; yPercent: number }>) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = {
      xPercent: randomPercent(15, 85),
      yPercent: randomPercent(22, 72),
    }

    if (existing.every((entry) => measurePercentDistance(entry, candidate) >= 12)) {
      return candidate
    }
  }

  return {
    xPercent: randomPercent(15, 85),
    yPercent: randomPercent(22, 72),
  }
}

function buildWorldAgentBase(record: BackendAgentRecord, occupied: Array<{ xPercent: number; yPercent: number }>): WorldAgent {
  const position = nextPosition(occupied)
  occupied.push(position)

  const resolvedImage = resolveAgentImage(record)

  return {
    id: record.id,
    label: record.name?.trim() || record.id,
    ...resolvedImage,
    ...position,
  }
}

export function buildWorldAgents(records: BackendAgentRecord[]): WorldAgent[] {
  const occupied: Array<{ xPercent: number; yPercent: number }> = []
  const withDummy = records.some((record) => record.id === DEFAULT_DUMMY_AGENT.id) ? records : [...records, DEFAULT_DUMMY_AGENT]

  return withDummy.map((record) => buildWorldAgentBase(record, occupied))
}

export function createLocalWorldAgent(existingAgents: WorldAgent[], record: CreatedAgentRecord): WorldAgent {
  const occupied = existingAgents.map((agent) => ({ xPercent: agent.xPercent, yPercent: agent.yPercent }))
  return buildWorldAgentBase({ id: record.id, name: record.name, imageAsset: `lpc:${DEFAULT_LPC_BUNDLE_ID}` }, occupied)
}

export function clampPercent(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function buildWorldPlayer(): WorldPlayer {
  return {
    id: 'user-player',
    label: 'You',
    imageSrc: PLAYER_IMAGE,
    spriteBundleId: DEFAULT_LPC_BUNDLE_ID,
    xPercent: 50,
    yPercent: 50,
  }
}
