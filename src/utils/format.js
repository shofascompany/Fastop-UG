export const DAY = 86400000

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

export function money(n, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0)
  } catch {
    return `${currency} ${(n || 0).toFixed(2)}`
  }
}

export function compact(n) {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0)
}

export const fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtDateTime = (t) =>
  new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function timeAgo(t) {
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return fmtDate(t)
}

export function startOfDay(t) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function startOfMonth(t = Date.now()) {
  const d = new Date(t)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Last n days (oldest first) as { key: dayStart, label } */
export function lastNDays(n) {
  const today = startOfDay(Date.now())
  return Array.from({ length: n }, (_, i) => {
    const key = today - (n - 1 - i) * DAY
    return { key, label: new Date(key).toLocaleDateString(undefined, { weekday: 'short' }) }
  })
}

export const toDateInput = (t) => {
  const d = new Date(t)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d - off).toISOString().slice(0, 10)
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function nameFromEmail(email) {
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim() || 'User'
  return local.replace(/\b\w/g, (c) => c.toUpperCase())
}

// name@domain.tld: no spaces, no empty parts, no trailing or double dots (same rule as the server)
export const isEmail = (v) => /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.-][^\s@.]*(\.[^\s@.]+)*\.[a-z]{2,}$/i.test((v || '').trim())

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export const sum = (arr, fn = (x) => x) => arr.reduce((a, x) => a + (Number(fn(x)) || 0), 0)
