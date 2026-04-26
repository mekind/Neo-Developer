const DEFAULT_API_BASE_URL = 'https://backend-kappa-brown-63.vercel.app'

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configured) {
    return trimTrailingSlash(configured)
  }

  return trimTrailingSlash(DEFAULT_API_BASE_URL)
}
