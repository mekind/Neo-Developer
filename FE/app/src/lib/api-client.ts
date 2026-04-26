import { getApiBaseUrl } from '@/config/env'

export async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`)

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}
