import { LOGIN_PAGE } from './constant'
import { redirectToPage } from './util'

let accessToken: string | null = null

let refreshing: Promise<boolean> | null = null

export function setAccessToken(token: string) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing
  refreshing = fetch('/api/auth/refresh/', { method: 'POST' })
    .then(async (resp) => {
      if (resp.ok) {
        const data = await resp.json()
        accessToken = data.access_token
        return true
      }
      return false
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

export async function primeToken(): Promise<void> {
  await refreshAccessToken()
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let resp = await fetch(url, { ...options, headers })

  if (resp.status === 401) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      redirectToPage(LOGIN_PAGE)
      return resp
    }
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
    resp = await fetch(url, { ...options, headers })
    if (resp.status === 401) {
      redirectToPage(LOGIN_PAGE)
    }
  }

  return resp
}
