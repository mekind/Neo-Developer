import { getJson } from '@/lib/api-client'

export interface Item {
  id: string
  name: string
  description?: string
  price: number
  createdAt: string
  updatedAt: string
}

function isItem(value: unknown): value is Item {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    (candidate.description === undefined || typeof candidate.description === 'string') &&
    typeof candidate.price === 'number' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

export async function listItems() {
  const payload = await getJson('/items')

  if (!Array.isArray(payload) || !payload.every(isItem)) {
    throw new Error('API response shape was invalid.')
  }

  return payload
}
