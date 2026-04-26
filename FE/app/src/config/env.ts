function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()

  if (!configured) {
    throw new Error('Missing VITE_API_BASE_URL configuration.')
  }

  return trimTrailingSlash(configured)
}
