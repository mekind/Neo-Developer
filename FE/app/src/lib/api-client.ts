import { getApiBaseUrl } from '@/config/env'

type JsonPrimitive = string | number | boolean | null

type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

function buildHeaders(body: unknown) {
  if (body === undefined) return undefined

  return {
    'Content-Type': 'application/json',
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? ({ message: text } satisfies { message: JsonValue }) : null
}

function toErrorMessage(payload: unknown, fallbackStatus: number) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (typeof payload === 'object' && payload !== null) {
    const candidate = payload as Record<string, unknown>
    const message = candidate.message

    if (typeof message === 'string' && message.trim()) {
      return message
    }

    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) {
      return message.join(', ')
    }
  }

  return `API 요청에 실패했습니다: ${fallbackStatus}`
}

export async function requestJson(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(init.body),
      ...(init.headers ?? {}),
    },
  })

  const payload = await readResponseBody(response)

  if (!response.ok) {
    throw new Error(toErrorMessage(payload, response.status))
  }

  return payload
}

export function getJson(path: string): Promise<unknown> {
  return requestJson(path)
}

export function postJson(path: string, body?: unknown): Promise<unknown> {
  return requestJson(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
