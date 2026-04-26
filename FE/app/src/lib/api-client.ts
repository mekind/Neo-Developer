import { getApiBaseUrl } from '@/config/env'

export async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`)

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}

export async function postJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}
