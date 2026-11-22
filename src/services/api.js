// Small client for the Fastop API server (see server/index.js).
const TOKEN_KEY = 'fastop-token'

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(t) {
    try {
      localStorage.setItem(TOKEN_KEY, t)
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {}
  },
}

export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message)
    this.status = status
    this.data = data
  }
}

export async function api(path, { method = 'GET', body, timeout = 15000 } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  let res
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctrl.signal })
  } catch {
    throw new ApiError("We can't reach Fastop right now. Check your internet connection and try again.", 0)
  } finally {
    clearTimeout(timer)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data)
  return data
}
