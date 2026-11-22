// Password hashing, signed session tokens and one-time-code hashing.
// Uses only Node's built-in crypto module.
import crypto from 'node:crypto'

const SCRYPT_KEYLEN = 64

/** Hash a password with a random salt (scrypt). Returns "salt:hash" in hex. */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

/** Constant-time check of a password against a stored "salt:hash". */
export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false
  const [saltHex, hashHex] = stored.split(':')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

/** A random 6-digit verification code ("000000"–"999999"). */
export function newCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

/** Codes are stored only as a keyed hash, never in plain text. */
export function hashCode(code, secret) {
  return crypto.createHmac('sha256', secret).update(String(code)).digest('hex')
}

export function safeEqualHex(a, b) {
  const x = Buffer.from(a || '', 'hex')
  const y = Buffer.from(b || '', 'hex')
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y)
}

const b64url = (buf) => Buffer.from(buf).toString('base64url')

/** Minimal signed token: base64url(payload).base64url(HMAC-SHA256). */
export function signToken(payload, secret, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000)
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds }))
  const sig = b64url(crypto.createHmac('sha256', secret).update(body).digest())
  return `${body}.${sig}`
}

/** Returns the payload if the signature is valid and not expired, otherwise null. */
export function verifyToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = b64url(crypto.createHmac('sha256', secret).update(body).digest())
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export const randomId = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`
