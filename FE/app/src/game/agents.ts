export interface BackendAgentRecord {
  id: string
  name?: string
  imageAsset?: string | null
}

export interface WorldAgent {
  id: string
  label: string
  imageSrc: string
  usesPlaceholder: boolean
  xPercent: number
  yPercent: number
}

function createPlaceholderPersonIcon(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="placeholder person avatar">
      <rect width="96" height="96" rx="24" fill="#fde68a" />
      <circle cx="48" cy="30" r="15" fill="#7c5a3c" />
      <path d="M26 78c3-15 12-24 22-24 11 0 20 9 22 24" fill="#7c5a3c" />
      <circle cx="42" cy="28" r="2.5" fill="#fff7ed" />
      <circle cx="54" cy="28" r="2.5" fill="#fff7ed" />
      <path d="M40 38c2 3 5 4 8 4s6-1 8-4" stroke="#fff7ed" stroke-width="3" stroke-linecap="round" fill="none" />
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const PLACEHOLDER_AGENT_IMAGE = createPlaceholderPersonIcon()

function isAllowedImageAsset(value: string) {
  return value.startsWith('data:image/') || value.startsWith('https://')
}

function resolveAgentImage(imageAsset: string | null | undefined) {
  const trimmed = imageAsset?.trim()

  if (!trimmed || !isAllowedImageAsset(trimmed)) {
    return {
      imageSrc: PLACEHOLDER_AGENT_IMAGE,
      usesPlaceholder: true,
    }
  }

  return {
    imageSrc: trimmed,
    usesPlaceholder: false,
  }
}

function randomPercent(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function distance(a: { xPercent: number; yPercent: number }, b: { xPercent: number; yPercent: number }) {
  return Math.hypot(a.xPercent - b.xPercent, a.yPercent - b.yPercent)
}

function nextPosition(existing: Array<{ xPercent: number; yPercent: number }>) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = {
      xPercent: randomPercent(15, 85),
      yPercent: randomPercent(22, 72),
    }

    if (existing.every((entry) => distance(entry, candidate) >= 12)) {
      return candidate
    }
  }

  return {
    xPercent: randomPercent(15, 85),
    yPercent: randomPercent(22, 72),
  }
}

export function buildWorldAgents(records: BackendAgentRecord[]): WorldAgent[] {
  const occupied: Array<{ xPercent: number; yPercent: number }> = []

  return records.map((record) => {
    const position = nextPosition(occupied)
    occupied.push(position)

    const resolvedImage = resolveAgentImage(record.imageAsset)

    return {
      id: record.id,
      label: record.name?.trim() || record.id,
      ...resolvedImage,
      ...position,
    }
  })
}
