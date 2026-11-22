// Fastop API server: accounts, email verification, and all app data.
// Data lives in Supabase when configured (see supabase/README.md), otherwise in server/data/db.json.
// Run with:  npm run api   (reads settings from .env)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { repo, usingSupabase, migrateLocalAccounts, DEFAULT_SETTINGS } from './repo.js'
import { hashPassword, verifyPassword, newCode, hashCode, safeEqualHex, signToken, verifyToken, randomId } from './security.js'
import { sendVerificationCode, mailConfigured } from './mailer.js'

const PORT = Number(process.env.PORT || 8787)
const SECRET = process.env.AUTH_SECRET || repo.secret || crypto.randomBytes(32).toString('hex')
const CODE_MINUTES = 15
const CODE_MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 60_000
const SESSION_SECONDS = 60 * 60 * 24 * 7 // 7 days

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

// name@domain.tld: no spaces, no empty parts, no trailing or double dots
const isEmail = (v) => typeof v === 'string' && v.trim().length <= 254 && /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.-][^\s@.]*(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(v.trim())
const normEmail = (v) => String(v || '').trim().toLowerCase()
const nameFromEmail = (email) =>
  (email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim() || 'User').replace(/\b\w/g, (c) => c.toUpperCase())
const validId = (v, prefix) => typeof v === 'string' && new RegExp(`^${prefix}_[a-z0-9]{4,40}$`).test(v)
const str = (v, max = 500) => String(v ?? '').slice(0, max)
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]))

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  username: u.username || null,
  phone: u.phone || null,
  role: u.role,
  status: u.status,
  verified: u.verified,
  needsSetup: !!u.needsSetup,
  onboarded: u.onboarded !== false,
  createdAt: u.createdAt,
})

// Ugandan phone numbers in any common form (0726…, 726…, +256 726…, 256726…) -> "256726128782"
function normPhone(v) {
  let d = String(v || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 10 && d.startsWith('0')) d = '256' + d.slice(1)
  else if (d.length === 9 && d.startsWith('7')) d = '256' + d
  return /^\d{11,15}$/.test(d) ? d : ''
}
const isUsername = (v) => typeof v === 'string' && /^[a-z0-9][a-z0-9._]{2,29}$/i.test(v.trim())
const looksLikePhone = (v) => /^[+\d][\d\s()-]{6,}$/.test(String(v || '').trim())

/** Find an account by whatever the person typed: email, phone number or username. */
async function findByLogin(identifier) {
  const raw = String(identifier || '').trim()
  if (raw.includes('@')) return { kind: 'email', user: isEmail(raw) ? await repo.findUserByEmail(normEmail(raw)) : null, valid: isEmail(raw) }
  // phone / username columns only exist once the shop-owner migration has run
  const safe = (p) => p.catch((e) => (console.warn('Login lookup:', e.message), null))
  if (looksLikePhone(raw)) {
    const phone = normPhone(raw)
    return { kind: 'phone', user: phone ? await safe(repo.findUserByPhone(phone)) : null, valid: !!phone }
  }
  return { kind: 'username', user: isUsername(raw) ? await safe(repo.findUserByUsername(raw)) : null, valid: isUsername(raw) }
}

// j***e@gmail.com: enough for the owner to recognise, not enough to harvest
function maskEmail(email) {
  const [local, domain] = email.split('@')
  return `${local[0]}${'*'.repeat(Math.max(2, local.length - 2))}${local.length > 1 ? local.at(-1) : ''}@${domain}`
}
const SETUP_SECONDS = 20 * 60

async function log(type, message) {
  try {
    await repo.insert('activity', { id: randomId('log'), type, message: str(message, 300), at: Date.now() })
  } catch (e) {
    console.warn('activity log failed:', e.message)
  }
}

// ---------- startup: the one Control Centre account ----------
async function ensureAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD are not set in .env. No one can open the Control Centre.')
    return
  }
  // Only one admin may exist: demote anyone else first (the database also enforces this).
  for (const u of await repo.all('users', { role: 'admin' })) {
    if (u.email.toLowerCase() !== ADMIN_EMAIL) await repo.update('users', u.id, { role: 'customer' })
  }
  const admin = await repo.findUserByEmail(ADMIN_EMAIL)
  if (!admin) {
    await repo.insert('users', { id: randomId('usr'), email: ADMIN_EMAIL, name: 'Fastop Admin', role: 'admin', status: 'active', verified: true, passwordHash: hashPassword(ADMIN_PASSWORD), createdAt: Date.now() })
  } else {
    const patch = { role: 'admin', status: 'active', verified: true }
    if (!verifyPassword(ADMIN_PASSWORD, admin.passwordHash)) patch.passwordHash = hashPassword(ADMIN_PASSWORD)
    await repo.update('users', admin.id, patch)
  }
}

// Every shop-owner account gets a shop record.
async function ensureShopFor(user) {
  if (user.role !== 'shop') return null
  const existing = await repo.all('shops', { ownerId: user.id }, { limit: 1 })
  if (existing.length) return existing[0]
  const settings = await repo.getSettings()
  const [lat, lng] = settings.mapCenter || DEFAULT_SETTINGS.mapCenter
  const shop = await repo.insert('shops', {
    id: randomId('shp'),
    ownerId: user.id,
    name: `${user.name.split(' ')[0]}'s Shop`,
    category: 'other',
    description: '',
    phone: '',
    email: user.email,
    address: '',
    hours: 'Mon to Sat, 8am-6pm',
    lat: lat + (Math.random() - 0.5) * 0.03,
    lng: lng + (Math.random() - 0.5) * 0.03,
    status: settings.requireShopApproval ? 'pending' : 'active',
    createdAt: Date.now(),
  })
  await log('shop', `${shop.name} registered${shop.status === 'pending' ? ' and is awaiting approval' : ''}`)
  return shop
}

// ---------- simple per-IP rate limiting ----------
const hits = new Map()
function limited(key, max, windowMs) {
  const now = Date.now()
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(key, list)
  return list.length > max
}
setInterval(() => hits.clear(), 30 * 60_000).unref()

// ---------- HTTP helpers ----------
function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(data))
}
class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.status = status
    this.extra = extra
  }
}
const fail = (status, message, extra) => {
  throw new HttpError(status, message, extra)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > 200_000) {
        reject(new HttpError(413, 'Request too large.'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch {
        reject(new HttpError(400, 'Invalid request.'))
      }
    })
    req.on('error', reject)
  })
}

const ip = (req) => req.socket.remoteAddress || 'unknown'

async function currentUser(req) {
  const auth = req.headers.authorization || ''
  const payload = verifyToken(auth.startsWith('Bearer ') ? auth.slice(7) : '', SECRET)
  if (!payload) return null
  const user = await repo.get('users', payload.sub)
  return user && user.status === 'active' ? user : null
}
async function requireUser(req) {
  const u = await currentUser(req)
  if (!u) fail(401, 'Please sign in.')
  return u
}
const sessionFor = (user) => ({ token: signToken({ sub: user.id, role: user.role }, SECRET, SESSION_SECONDS), user: publicUser(user) })

async function issueCode(user) {
  const code = newCode()
  await repo.upsert('codes', { email: user.email, codeHash: hashCode(code, SECRET), expiresAt: Date.now() + CODE_MINUTES * 60_000, attempts: 0, sentAt: Date.now() })
  await sendVerificationCode(user.email, code, CODE_MINUTES)
}

/** Send a code unless a fresh one was sent less than a minute ago. */
async function issueCodeIfDue(user) {
  const pending = await repo.get('codes', user.email)
  if (!pending || pending.expiresAt < Date.now() || Date.now() - pending.sentAt > RESEND_COOLDOWN_MS) await issueCode(user)
}

/** Throws a friendly error unless `code` is this user's current emailed code; consumes it on success. */
async function consumeCode(user, rawCode) {
  const code = String(rawCode || '').replace(/\D/g, '')
  const pending = await repo.get('codes', user.email)
  if (!pending) fail(400, 'No code is waiting for this account. Please start again.')
  if (pending.expiresAt < Date.now()) fail(410, 'This code has expired. Tap “Send a new code”.', { expired: true })
  if (pending.attempts >= CODE_MAX_ATTEMPTS) fail(429, 'Too many wrong codes. Tap “Send a new code”.', { expired: true })
  if (code.length !== 6 || !safeEqualHex(hashCode(code, SECRET), pending.codeHash)) {
    const attempts = pending.attempts + 1
    await repo.update('codes', user.email, { attempts })
    const left = CODE_MAX_ATTEMPTS - attempts
    fail(400, left > 0 ? `That code isn't right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong codes. Tap “Send a new code”.', { attemptsLeft: left })
  }
  await repo.remove('codes', user.email)
}

// ======================================================================
// Auth routes
// ======================================================================
const routes = {
  // One form, two jobs: sign in if the account exists, otherwise create it and email a code.
  'POST /api/auth/continue': async (req, body) => {
    const identifier = String(body.identifier ?? body.email ?? '').trim()
    const password = String(body.password || '')
    const found = await findByLogin(identifier)
    if (!found.valid) fail(400, found.kind === 'phone' ? 'Please enter a valid phone number.' : found.kind === 'email' ? 'Please enter a valid email address.' : 'Enter your email, phone number or username.')
    if (password.length < 6) fail(400, 'Password must be at least 6 characters.')
    const key = identifier.toLowerCase()
    if (limited(`continue:${ip(req)}`, 20, 10 * 60_000) || limited(`continue:${key}`, 8, 10 * 60_000)) fail(429, 'Too many attempts. Please wait a few minutes and try again.')

    let user = found.user
    if (!user && found.kind !== 'email') fail(404, `No account uses that ${found.kind === 'phone' ? 'phone number' : 'username'}.`)
    const email = user ? user.email : normEmail(identifier)
    if (user) {
      if (user.needsSetup) fail(409, 'Your shop account is ready to set up. Enter your email again to get your code.', { setup: true })
      if (!verifyPassword(password, user.passwordHash)) fail(401, `That password is incorrect for this ${found.kind}.`)
      if (user.status !== 'active') fail(403, 'This account is suspended. Please contact Fastop support.')
      if (!user.verified) {
        const pending = await repo.get('codes', user.email)
        if (!pending || pending.expiresAt < Date.now() || Date.now() - pending.sentAt > RESEND_COOLDOWN_MS) await issueCode(user)
        return [200, { next: 'verify', email: user.email }]
      }
      await log('auth', `${user.email} signed in`)
      return [200, { next: 'done', ...sessionFor(user) }]
    }

    // New emails become shopper accounts. Shops are registered by the Control Centre, never self-made.
    const role = 'customer'
    user = await repo.insert('users', {
      id: randomId('usr'),
      email,
      name: nameFromEmail(email),
      role,
      status: 'active',
      verified: false,
      passwordHash: hashPassword(password),
      createdAt: Date.now(),
    })
    await log('user', `New ${role} account: ${email}`)
    try {
      await issueCode(user)
    } catch (e) {
      console.error('Could not send verification email:', e.message)
      fail(502, "We couldn't send the verification email. Please try again in a moment.")
    }
    return [201, { next: 'verify', email, created: true }]
  },

  'POST /api/auth/verify': async (req, body) => {
    const email = normEmail(body.email)
    if (limited(`verify:${ip(req)}`, 30, 10 * 60_000)) fail(429, 'Too many attempts. Please wait a few minutes.')
    const user = await repo.findUserByEmail(email)
    if (!user) fail(400, 'No code is waiting for this email. Please sign in again.')
    if (user.needsSetup) fail(409, 'This shop account still needs setting up. Please sign in again.')
    if (user.verified) return [200, sessionFor(user)]
    await consumeCode(user, body.code)
    const verified = await repo.update('users', user.id, { verified: true })
    await ensureShopFor(verified)
    await log('auth', `${user.email} confirmed their email`)
    return [200, sessionFor(verified)]
  },

  'POST /api/auth/resend': async (req, body) => {
    if (limited(`resend:${ip(req)}`, 10, 10 * 60_000)) fail(429, 'Too many requests. Please wait a few minutes.')
    const { user } = await findByLogin(body.identifier ?? body.email)
    if (!user || (user.verified && !user.needsSetup)) return [200, { ok: true }]
    const pending = await repo.get('codes', user.email)
    if (pending && Date.now() - pending.sentAt < RESEND_COOLDOWN_MS) {
      fail(429, 'Please wait a minute before asking for another code.', { retryIn: Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - pending.sentAt)) / 1000) })
    }
    try {
      await issueCode(user)
    } catch (e) {
      console.error('Could not send verification email:', e.message)
      fail(502, "We couldn't send the email. Please try again in a moment.")
    }
    return [200, { ok: true }]
  },

  // As soon as the sign-in box holds a complete email / phone / username: who is this?
  //   existing  -> ask for their password
  //   setup     -> shop registered by the admin, first sign-in: a code is emailed to the owner
  //   new       -> unknown email: create a shopper account
  //   unknown   -> unknown phone/username
  'POST /api/auth/lookup': async (req, body) => {
    if (limited(`lookup:${ip(req)}`, 40, 10 * 60_000)) fail(429, 'Too many checks. Please wait a few minutes.')
    const found = await findByLogin(body.identifier)
    if (!found.valid) return [200, { status: 'invalid', kind: found.kind }]
    const user = found.user
    if (!user) return [200, { status: found.kind === 'email' ? 'new' : 'unknown', kind: found.kind }]
    if (user.status !== 'active') return [200, { status: 'suspended', kind: found.kind }]
    const firstName = (user.name || '').split(' ')[0]
    if (user.needsSetup) {
      const [shop] = await repo.all('shops', { ownerId: user.id }, { limit: 1 })
      try {
        await issueCodeIfDue(user)
      } catch (e) {
        console.error('Could not send setup code:', e.message)
        fail(502, "We couldn't send your code. Please try again in a moment.")
      }
      return [200, { status: 'setup', kind: found.kind, name: firstName, shopName: shop?.name || '', sentTo: maskEmail(user.email) }]
    }
    return [200, { status: 'existing', kind: found.kind, name: firstName, role: user.role }]
  },

  // First sign-in of an admin-registered shop owner, step 1: prove it's them with the emailed code.
  'POST /api/auth/setup/verify': async (req, body) => {
    if (limited(`setup:${ip(req)}`, 30, 10 * 60_000)) fail(429, 'Too many attempts. Please wait a few minutes.')
    const { user } = await findByLogin(body.identifier)
    if (!user || !user.needsSetup) fail(400, 'This account is already set up. Sign in with your password.')
    await consumeCode(user, body.code)
    const [shop] = await repo.all('shops', { ownerId: user.id }, { limit: 1 })
    const suggested = (shop?.name || user.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20)
    return [200, { setupToken: signToken({ sub: user.id, purpose: 'setup' }, SECRET, SETUP_SECONDS), name: user.name, shopName: shop?.name || '', email: user.email, suggestedUsername: suggested }]
  },

  // Step 2: choose the username + password they'll sign in with from now on.
  'POST /api/auth/setup/complete': async (req, body) => {
    const payload = verifyToken(String(body.setupToken || ''), SECRET)
    if (!payload || payload.purpose !== 'setup') fail(401, 'This setup link has expired. Please sign in again to get a new code.')
    const user = await repo.get('users', payload.sub)
    if (!user || !user.needsSetup) fail(400, 'This account is already set up. Sign in with your password.')
    const username = String(body.username || '').trim()
    const password = String(body.password || '')
    if (!isUsername(username)) fail(400, 'Usernames are 3–30 letters, numbers, dots or underscores, starting with a letter or number.')
    if (password.length < 8) fail(400, 'Choose a password of at least 8 characters.')
    const clash = await repo.findUserByUsername(username)
    if (clash && clash.id !== user.id) fail(409, 'That username is taken. Try another.')
    const ready = await repo.update('users', user.id, { username: username.toLowerCase(), passwordHash: hashPassword(password), needsSetup: false, verified: true, onboarded: false })
    await log('auth', `${ready.email} finished setting up their shop account`)
    return [200, sessionFor(ready)]
  },

  // The welcome walkthrough has been seen.
  'POST /api/auth/onboarded': async (req) => {
    const user = await requireUser(req)
    const updated = await repo.update('users', user.id, { onboarded: true })
    return [200, { user: publicUser(updated) }]
  },

  // Control Centre registers a shop with all its details; the owner finishes the account on first sign-in.
  'POST /api/admin/shops': async (req, body) => {
    if ((await requireUser(req)).role !== 'admin') fail(403, 'Admins only.')
    if (!(await repo.hasLoginColumns())) fail(503, 'Run migrations/20261123000000_shop_owner_login.sql in Supabase first (SQL Editor), then try again.')
    const o = body.owner || {}
    const s = body.shop || {}
    const email = normEmail(o.email)
    if (!isEmail(email)) fail(400, "Enter the owner's email address. Their sign-in code is sent there.")
    if (await repo.findUserByEmail(email)) fail(409, 'An account with this email already exists.')
    let phone = null
    if (String(o.phone || '').trim()) {
      phone = normPhone(o.phone)
      if (!phone) fail(400, "That phone number doesn't look right.")
      if (await repo.findUserByPhone(phone)) fail(409, 'Another account already uses this phone number.')
    }
    const shopName = str(s.name, 120).trim()
    if (!shopName) fail(400, 'Give the shop a name.')
    const user = await repo.insert('users', {
      id: randomId('usr'),
      email,
      phone,
      name: str(o.name, 80).trim() || nameFromEmail(email),
      role: 'shop',
      status: 'active',
      verified: false,
      needsSetup: true,
      onboarded: false,
      passwordHash: hashPassword(crypto.randomBytes(24).toString('hex')), // unusable until the owner sets one
      createdAt: Date.now(),
    })
    const settings = await repo.getSettings()
    const [lat, lng] = settings.mapCenter || DEFAULT_SETTINGS.mapCenter
    const shop = await repo.insert('shops', {
      id: randomId('shp'),
      ownerId: user.id,
      name: shopName,
      category: str(s.category, 40) || 'other',
      description: str(s.description, 2000),
      phone: str(s.phone || o.phone, 40),
      email,
      address: str(s.address, 200),
      hours: str(s.hours, 200) || 'Mon to Sat, 8am-6pm',
      lat: Number(s.lat) || lat,
      lng: Number(s.lng) || lng,
      status: 'active',
      createdAt: Date.now(),
    })
    await log('shop', `Control Centre registered ${shop.name} (${email})`)
    return [201, { user: publicUser(user), shop }]
  },

  'GET /api/auth/me': async (req) => {
    const user = await requireUser(req)
    return [200, { user: publicUser(user) }]
  },

  // ---------- Control Centre: accounts ----------
  'GET /api/admin/users': async (req) => {
    if ((await requireUser(req)).role !== 'admin') fail(403, 'Admins only.')
    return [200, { users: (await repo.all('users', {}, { order: '-createdAt' })).map(publicUser) }]
  },

  'POST /api/admin/users': async (req, body) => {
    if ((await requireUser(req)).role !== 'admin') fail(403, 'Admins only.')
    const email = normEmail(body.email)
    if (!isEmail(email)) fail(400, 'Enter a valid email address.')
    if (await repo.findUserByEmail(email)) fail(409, 'An account with this email already exists.')
    if (String(body.password || '').length < 6) fail(400, 'Password must be at least 6 characters.')
    const user = await repo.insert('users', {
      id: randomId('usr'),
      email,
      name: str(body.name, 80).trim() || nameFromEmail(email),
      role: body.role === 'shop' ? 'shop' : 'customer',
      status: body.status === 'suspended' ? 'suspended' : 'active',
      verified: true, // created by the admin, so no code needed
      passwordHash: hashPassword(String(body.password)),
      createdAt: Date.now(),
    })
    await ensureShopFor(user)
    await log('user', `Admin created ${user.role} account ${email}`)
    return [201, { user: publicUser(user) }]
  },

  // ======================================================================
  // App data
  // ======================================================================

  // Everything the signed-in person (or a guest) is allowed to see.
  'GET /api/data': async (req) => {
    const me = await currentUser(req)
    const settings = await repo.getSettings()
    const isAdmin = me?.role === 'admin'

    let shops, products
    if (isAdmin) {
      ;[shops, products] = await Promise.all([repo.all('shops', {}, { order: '-createdAt' }), repo.all('products', {}, { order: '-createdAt' })])
    } else {
      const active = await repo.all('shops', { status: 'active' }, { order: '-createdAt' })
      const mine = me?.role === 'shop' ? await repo.all('shops', { ownerId: me.id }) : []
      shops = [...mine, ...active.filter((s) => !mine.some((m) => m.id === s.id))]
      const activeIds = active.map((s) => s.id)
      const mineIds = mine.map((s) => s.id)
      const pub = activeIds.length ? await repo.all('products', { shopId: activeIds, visible: true }, { order: '-createdAt' }) : []
      const own = mineIds.length ? await repo.all('products', { shopId: mineIds }, { order: '-createdAt' }) : []
      // Customers and guests never receive prices or cost prices (the showcase is price-free).
      products = [...own, ...pub.filter((p) => !mineIds.includes(p.shopId)).map(({ price, cost, ...p }) => p)]
    }

    const myShopIds = me?.role === 'shop' ? shops.filter((s) => s.ownerId === me.id).map((s) => s.id) : []
    let sales = [], expenses = [], enquiries = [], activity = [], users = []
    if (isAdmin) {
      ;[sales, expenses, enquiries, activity, users] = await Promise.all([
        repo.all('sales', {}, { order: '-createdAt' }),
        repo.all('expenses', {}, { order: '-date' }),
        repo.all('enquiries', {}, { order: '-createdAt' }),
        repo.all('activity', {}, { order: '-at', limit: 300 }),
        repo.all('users', {}, { order: '-createdAt' }),
      ])
      users = users.map(publicUser)
    } else if (me) {
      if (myShopIds.length) {
        ;[sales, expenses] = await Promise.all([repo.all('sales', { shopId: myShopIds }, { order: '-createdAt' }), repo.all('expenses', { shopId: myShopIds }, { order: '-date' })])
      }
      const toShop = myShopIds.length ? await repo.all('enquiries', { shopId: myShopIds }, { order: '-createdAt' }) : []
      const fromMe = await repo.all('enquiries', { customerId: me.id }, { order: '-createdAt' })
      enquiries = [...toShop, ...fromMe.filter((e) => !toShop.some((t) => t.id === e.id))]
      // people a shop owner needs to see: customers who wrote to them (name + email only)
      const ids = [...new Set(toShop.map((e) => e.customerId))].filter((id) => id !== me.id)
      const people = ids.length ? await repo.all('users', { id: ids }) : []
      users = [publicUser(me), ...people.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status }))]
    }
    const favorites = me ? (await repo.all('favorites', { userId: me.id })).map((f) => f.productId) : []
    return [200, { settings, shops, products, sales, expenses, enquiries, activity, users, me: me ? { ...publicUser(me), favorites } : null }]
  },
}

// ---------- permission helpers ----------
async function shopFor(user, shopId) {
  const shop = await repo.get('shops', shopId)
  if (!shop) fail(404, 'Shop not found.')
  if (user.role !== 'admin' && shop.ownerId !== user.id) fail(403, "You can only manage your own shop.")
  return shop
}
const PRODUCT_FIELDS = ['name', 'category', 'description', 'price', 'cost', 'stock', 'sku', 'image', 'visible', 'featured']
function cleanProduct(p) {
  const out = pick(p, PRODUCT_FIELDS)
  for (const k of ['name', 'category', 'description', 'sku', 'image']) if (out[k] !== undefined) out[k] = str(out[k], k === 'description' ? 2000 : 300)
  for (const k of ['price', 'cost']) if (out[k] !== undefined) out[k] = Math.max(0, Number(out[k]) || 0)
  if (out.stock !== undefined) out.stock = Math.max(0, Math.floor(Number(out.stock) || 0))
  for (const k of ['visible', 'featured']) if (out[k] !== undefined) out[k] = !!out[k]
  return out
}

// ---------- data actions: POST /api/data/<action> ----------
const actions = {
  async updateShop(me, { id, patch = {} }) {
    const shop = await shopFor(me, id)
    const allowed = ['name', 'category', 'description', 'phone', 'email', 'address', 'hours', 'lat', 'lng', ...(me.role === 'admin' ? ['status'] : [])]
    const clean = pick(patch, allowed)
    for (const k of ['name', 'category', 'description', 'phone', 'email', 'address', 'hours']) if (clean[k] !== undefined) clean[k] = str(clean[k], k === 'description' ? 2000 : 200)
    for (const k of ['lat', 'lng']) if (clean[k] !== undefined) clean[k] = Number(clean[k]) || 0
    if (clean.status && !['active', 'pending', 'suspended'].includes(clean.status)) fail(400, 'Invalid status.')
    const updated = await repo.update('shops', id, clean)
    await log('shop', clean.status && clean.status !== shop.status ? `${shop.name} is now ${clean.status}` : `${updated.name} profile updated`)
    return { shop: updated }
  },
  async deleteShop(me, { id }) {
    if (me.role !== 'admin') fail(403, 'Admins only.')
    const shop = await repo.get('shops', id)
    if (!shop) return { ok: true }
    for (const t of ['enquiries', 'sales', 'expenses', 'products']) await repo.removeWhere(t, { shopId: id })
    await repo.remove('shops', id)
    await log('shop', `Deleted shop ${shop.name}`)
    return { ok: true }
  },
  async saveProduct(me, { product = {} }) {
    const shop = await shopFor(me, product.shopId)
    const clean = cleanProduct(product)
    const existing = product.id ? await repo.get('products', product.id) : null
    if (existing) {
      if (existing.shopId !== shop.id) fail(403, 'That product belongs to another shop.')
      return { product: await repo.update('products', existing.id, clean) }
    }
    if (!clean.name) fail(400, 'A product needs a name.')
    const id = validId(product.id, 'prd') ? product.id : randomId('prd')
    const created = await repo.insert('products', { visible: true, featured: false, image: '', views: 0, sku: id.toUpperCase().replace('_', '-').slice(0, 12), ...clean, id, shopId: shop.id, createdAt: Date.now() })
    await log('product', `${shop.name} listed "${created.name}"`)
    return { product: created }
  },
  async updateProduct(me, { id, patch = {} }) {
    const p = await repo.get('products', id)
    if (!p) fail(404, 'Product not found.')
    await shopFor(me, p.shopId)
    return { product: await repo.update('products', id, cleanProduct(patch)) }
  },
  async deleteProduct(me, { id }) {
    const p = await repo.get('products', id)
    if (!p) return { ok: true }
    await shopFor(me, p.shopId)
    await repo.removeWhere('favorites', { productId: id })
    await repo.remove('products', id)
    await log('product', `Removed product "${p.name}"`)
    return { ok: true }
  },
  async recordSale(me, { id, shopId, items = [], paymentMethod, customerName }) {
    await shopFor(me, shopId)
    if (!Array.isArray(items) || !items.length) fail(400, 'A sale needs at least one item.')
    const clean = items.slice(0, 200).map((it) => ({
      productId: str(it.productId, 60),
      name: str(it.name, 200),
      qty: Math.max(1, Math.floor(Number(it.qty) || 1)),
      price: Math.max(0, Number(it.price) || 0),
      cost: Math.max(0, Number(it.cost) || 0),
    }))
    const sale = await repo.recordSale({ id: validId(id, 'sal') ? id : randomId('sal'), shopId, items: clean, paymentMethod: str(paymentMethod || 'Cash', 40), customerName: str(customerName, 120) })
    return { sale }
  },
  async deleteSale(me, { id, restock = true }) {
    const sale = await repo.get('sales', id)
    if (!sale) return { ok: true }
    await shopFor(me, sale.shopId)
    await repo.voidSale(id, !!restock)
    return { ok: true }
  },
  async addExpense(me, { expense = {} }) {
    await shopFor(me, expense.shopId)
    const row = {
      id: validId(expense.id, 'exp') ? expense.id : randomId('exp'),
      shopId: expense.shopId,
      title: str(expense.title, 200) || 'Expense',
      category: str(expense.category, 60) || 'Other',
      amount: Math.max(0, Number(expense.amount) || 0),
      date: Number(expense.date) || Date.now(),
    }
    return { expense: await repo.insert('expenses', row) }
  },
  async deleteExpense(me, { id }) {
    const e = await repo.get('expenses', id)
    if (!e) return { ok: true }
    await shopFor(me, e.shopId)
    await repo.remove('expenses', id)
    return { ok: true }
  },
  async addEnquiry(me, { id, shopId, productId, message }) {
    const shop = await repo.get('shops', shopId)
    if (!shop || shop.status !== 'active') fail(404, 'This shop is not available.')
    if (!str(message).trim()) fail(400, 'Please write a message.')
    if (limited(`enq:${me.id}`, 20, 60 * 60_000)) fail(429, "You've sent a lot of messages. Please wait a little.")
    const row = {
      id: validId(id, 'enq') ? id : randomId('enq'),
      shopId,
      productId: productId && (await repo.get('products', productId)) ? productId : null,
      customerId: me.id,
      message: str(message, 1000).trim(),
      reply: '',
      status: 'new',
      createdAt: Date.now(),
    }
    return { enquiry: await repo.insert('enquiries', row) }
  },
  async replyEnquiry(me, { id, reply }) {
    const e = await repo.get('enquiries', id)
    if (!e) fail(404, 'Enquiry not found.')
    await shopFor(me, e.shopId)
    return { enquiry: await repo.update('enquiries', id, { reply: str(reply, 1000).trim(), status: 'replied', repliedAt: Date.now() }) }
  },
  async deleteEnquiry(me, { id }) {
    const e = await repo.get('enquiries', id)
    if (!e) return { ok: true }
    if (e.customerId !== me.id) await shopFor(me, e.shopId)
    await repo.remove('enquiries', id)
    return { ok: true }
  },
  async toggleFavorite(me, { productId }) {
    const p = await repo.get('products', productId)
    if (!p) fail(404, 'Product not found.')
    const mine = await repo.all('favorites', { userId: me.id, productId })
    if (mine.length) await repo.removeWhere('favorites', { userId: me.id, productId })
    else await repo.insert('favorites', { userId: me.id, productId, createdAt: Date.now() })
    return { favorites: (await repo.all('favorites', { userId: me.id })).map((f) => f.productId) }
  },
  async updateSettings(me, { patch = {} }) {
    if (me.role !== 'admin') fail(403, 'Admins only.')
    const current = await repo.getSettings()
    const clean = pick(patch, ['currency', 'allowShopSignup', 'requireShopApproval', 'announcement', 'mapCenter', 'supportEmail', 'appName'])
    if (clean.announcement !== undefined) clean.announcement = str(clean.announcement, 300)
    if (clean.mapCenter && !(Array.isArray(clean.mapCenter) && clean.mapCenter.length === 2)) delete clean.mapCenter
    const settings = await repo.saveSettings({ ...current, ...clean })
    await log('system', 'Platform settings updated')
    return { settings }
  },
  async clearActivity(me) {
    if (me.role !== 'admin') fail(403, 'Admins only.')
    await repo.removeWhere('activity', {})
    return { ok: true }
  },
  async resetPlatform(me) {
    if (me.role !== 'admin') fail(403, 'Admins only.')
    for (const t of ['favorites', 'enquiries', 'sales', 'expenses', 'products', 'shops', 'activity']) await repo.removeWhere(t, {})
    await repo.saveSettings({ ...DEFAULT_SETTINGS })
    for (const u of await repo.all('users', { role: 'shop' })) await ensureShopFor(u)
    await log('system', 'Platform data reset by the admin')
    return { ok: true }
  },
}

// Anyone (even guests) can count a product view; rate-limited per visitor.
async function viewProduct(req, body) {
  const id = str(body.id, 60)
  if (!limited(`view:${ip(req)}:${id}`, 1, 30 * 60_000)) await repo.incrementViews(id).catch(() => {})
  return [200, { ok: true }]
}

// PATCH / DELETE /api/admin/users/:id
async function adminUserById(req, id) {
  if ((await requireUser(req)).role !== 'admin') fail(403, 'Admins only.')
  const user = await repo.get('users', id)
  if (!user) fail(404, 'User not found.')
  if (user.role === 'admin') fail(400, 'The Control Centre account cannot be changed here.')
  if (req.method === 'DELETE') {
    for (const s of await repo.all('shops', { ownerId: id })) await actions.deleteShop({ role: 'admin' }, { id: s.id })
    await repo.removeWhere('favorites', { userId: id })
    await repo.removeWhere('enquiries', { customerId: id })
    await repo.remove('codes', user.email)
    await repo.remove('users', id)
    await log('user', `Deleted user ${user.email}`)
    return [200, { ok: true }]
  }
  const body = await readBody(req)
  const patch = {}
  if (body.name !== undefined) patch.name = str(body.name, 80).trim() || user.name
  if (body.role !== undefined) patch.role = body.role === 'shop' ? 'shop' : 'customer'
  if (body.status !== undefined) patch.status = body.status === 'suspended' ? 'suspended' : 'active'
  if (body.email !== undefined) {
    const email = normEmail(body.email)
    if (!isEmail(email)) fail(400, 'Enter a valid email address.')
    const clash = await repo.findUserByEmail(email)
    if (clash && clash.id !== user.id) fail(409, 'Another account already uses this email.')
    patch.email = email
  }
  if (body.password) {
    if (String(body.password).length < 6) fail(400, 'Password must be at least 6 characters.')
    patch.passwordHash = hashPassword(String(body.password))
  }
  const updated = await repo.update('users', id, patch)
  await ensureShopFor(updated)
  await log('user', `Updated user ${updated.email}`)
  return [200, { user: publicUser(updated) }]
}

// ---------- production: serve the built web app from dist/ ----------
const DIST = path.resolve('dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.txt': 'text/plain', '.xml': 'application/xml' }
function serveStatic(req, res) {
  if (!fs.existsSync(DIST)) return send(res, 404, { error: 'Not found' })
  let urlPath
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  } catch {
    return send(res, 400, { error: 'Bad address' })
  }
  let file = path.join(DIST, urlPath)
  const inside = file === DIST || file.startsWith(DIST + path.sep)
  const exists = inside && fs.existsSync(file) && !fs.statSync(file).isDirectory()
  if (!exists) {
    // A missing file (old /assets/… chunk, /logo.png typo) is a real 404, so the browser
    // doesn't receive the HTML page as a script. Page addresses (no extension) get the app.
    if (path.extname(urlPath)) return send(res, 404, { error: 'Not found' })
    file = path.join(DIST, 'index.html')
  }
  const immutable = file.includes(`${path.sep}assets${path.sep}`)
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache' })
  fs.createReadStream(file).pipe(res)
}

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x')
    if (!pathname.startsWith('/api/')) return serveStatic(req, res)

    let result
    const userRoute = pathname.match(/^\/api\/admin\/users\/([\w-]+)$/)
    const dataAction = pathname.match(/^\/api\/data\/(\w+)$/)
    if (userRoute && (req.method === 'PATCH' || req.method === 'DELETE')) {
      result = await adminUserById(req, userRoute[1])
    } else if (dataAction && req.method === 'POST') {
      const body = await readBody(req)
      if (dataAction[1] === 'viewProduct') result = await viewProduct(req, body)
      else {
        const fn = actions[dataAction[1]]
        if (!fn) fail(404, 'Unknown action.')
        const me = await requireUser(req)
        if (limited(`data:${me.id}`, 240, 60_000)) fail(429, 'Slow down a little and try again.')
        result = [200, await fn(me, body)]
      }
    } else {
      const handler = routes[`${req.method} ${pathname}`]
      if (!handler) fail(404, 'Not found.')
      const body = req.method === 'POST' ? await readBody(req) : {}
      result = await handler(req, body)
    }
    send(res, result[0], result[1])
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...e.extra })
    console.error(e)
    if (!res.headersSent) send(res, 500, { error: 'Something went wrong on our side. Please try again.' })
  }
})

async function start() {
  try {
    await repo.ready()
  } catch (e) {
    console.error(`\n✖ ${e.message}\n`)
    process.exit(1)
  }
  const copied = await migrateLocalAccounts()
  if (copied) console.log(`Copied ${copied} account(s) from server/data/db.json into Supabase.`)
  await ensureAdmin()
  for (const u of await repo.all('users', { role: 'shop' })) if (u.verified) await ensureShopFor(u)
  if (!(await repo.hasLoginColumns())) {
    console.warn('\n⚠ Shop-owner sign-in needs a database update: run migrations/20261123000000_shop_owner_login.sql in the Supabase SQL Editor.\n')
  }
  server.listen(PORT, () => {
    console.log(`Fastop API listening on http://localhost:${PORT}`)
    console.log(`Database: ${repo.kind}`)
    console.log(`Email: ${mailConfigured ? 'Gmail SMTP configured' : 'NOT configured (codes are printed here)'}`)
    if (!usingSupabase) console.warn('Supabase is not configured: add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env (see supabase/README.md).')
  })
}
start()
