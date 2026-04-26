import { getApiBaseUrl } from '@/config/env'

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}

export async function getJson(path: string): Promise<unknown> {
  return requestJson(path)
}

export async function postJson(path: string, body: unknown): Promise<unknown> {
  return requestJson(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
