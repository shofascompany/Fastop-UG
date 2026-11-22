// Data access for the Fastop API.
//
// Two interchangeable backends with the same interface:
//   - Supabase (PostgreSQL), used when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
//   - a local JSON file (server/data/db.json), used as a fallback for offline development
//
// The rest of the server only calls these functions, so it never cares which one is active.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------- mapping
// App objects use camelCase + millisecond timestamps; SQL uses snake_case + timestamptz.
const TABLES = {
  users: 'app_users',
  codes: 'verification_codes',
  shops: 'shops',
  products: 'products',
  sales: 'sales',
  expenses: 'expenses',
  enquiries: 'enquiries',
  favorites: 'favorites',
  activity: 'activity',
}
const TIME = new Set(['createdAt', 'repliedAt', 'at', 'date', 'expiresAt', 'sentAt'])
const NUM = new Set(['price', 'cost', 'total', 'amount'])
const toSnake = (k) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const toCamel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())

function toRow(obj) {
  const row = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    row[toSnake(k)] = TIME.has(k) && v != null ? new Date(v).toISOString() : v
  }
  return row
}
function fromRow(row) {
  if (!row) return row
  const obj = {}
  for (const [k, v] of Object.entries(row)) {
    const key = toCamel(k)
    obj[key] = TIME.has(key) && v != null ? new Date(v).getTime() : NUM.has(key) && v != null ? Number(v) : v
  }
  return obj
}

// ---------------------------------------------------------------- default settings
export const DEFAULT_SETTINGS = {
  appName: 'Fastop',
  currency: 'UGX',
  allowShopSignup: true,
  requireShopApproval: true,
  announcement: '',
  mapCenter: [0.3476, 32.5825],
  supportEmail: '',
}

// ================================================================ Supabase backend
function supabaseRepo(url, key) {
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const keyCol = (t) => (t === 'codes' ? 'email' : t === 'favorites' ? 'user_id' : 'id')
  const check = ({ data, error }) => {
    if (error) {
      const e = new Error(`Database error: ${error.message}`)
      e.code = error.code
      throw e
    }
    return data
  }
  const applyWhere = (q, where = {}) => {
    for (const [k, v] of Object.entries(where)) q = Array.isArray(v) ? q.in(toSnake(k), v) : q.eq(toSnake(k), v)
    return q
  }

  return {
    kind: 'Supabase',
    async ready() {
      const { error } = await sb.from('app_users').select('id').limit(1)
      if (error) {
        const missing = /relation|does not exist|schema cache|PGRST205|42P01/i.test(`${error.code} ${error.message}`)
        throw new Error(
          missing
            ? 'Supabase is connected but the tables are missing. Run supabase/migrations/20261122000000_fastop_schema.sql in the Supabase SQL Editor.'
            : `Cannot reach Supabase: ${error.message}`,
        )
      }
    },
    async all(table, where, { order, limit } = {}) {
      let q = applyWhere(sb.from(TABLES[table]).select('*'), where)
      if (order) q = q.order(toSnake(order.replace(/^-/, '')), { ascending: !order.startsWith('-') })
      q = q.range(0, (limit || 5000) - 1)
      return check(await q).map(fromRow)
    },
    async get(table, id) {
      const data = check(await sb.from(TABLES[table]).select('*').eq(keyCol(table), id).maybeSingle())
      return data ? fromRow(data) : null
    },
    async findUserByEmail(email) {
      const data = check(await sb.from('app_users').select('*').ilike('email', email.replace(/[%_\\]/g, '\\$&')).maybeSingle())
      return data ? fromRow(data) : null
    },
    async findUserByPhone(phone) {
      const data = check(await sb.from('app_users').select('*').eq('phone', phone).maybeSingle())
      return data ? fromRow(data) : null
    },
    async findUserByUsername(username) {
      const data = check(await sb.from('app_users').select('*').ilike('username', username.replace(/[%_\\]/g, '\\$&')).maybeSingle())
      return data ? fromRow(data) : null
    },
    /** True once migrations/20261123000000_shop_owner_login.sql has been run. */
    async hasLoginColumns() {
      const { error } = await sb.from('app_users').select('username, phone, needs_setup, onboarded').limit(1)
      return !error
    },
    async insert(table, obj) {
      return fromRow(check(await sb.from(TABLES[table]).insert(toRow(obj)).select().single()))
    },
    async upsert(table, obj) {
      return fromRow(check(await sb.from(TABLES[table]).upsert(toRow(obj)).select().single()))
    },
    async update(table, id, patch) {
      const row = toRow(patch)
      if (!Object.keys(row).length) return this.get(table, id) // nothing allowed to change
      const data = check(await sb.from(TABLES[table]).update(row).eq(keyCol(table), id).select().maybeSingle())
      return data ? fromRow(data) : null
    },
    async remove(table, id) {
      check(await sb.from(TABLES[table]).delete().eq(keyCol(table), id))
    },
    async removeWhere(table, where = {}) {
      let q = sb.from(TABLES[table]).delete()
      // PostgREST refuses unfiltered deletes; "delete everything" is made explicit.
      q = Object.keys(where).length ? applyWhere(q, where) : q.not(keyCol(table), 'is', null)
      check(await q)
    },
    async count(table) {
      const { count, error } = await sb.from(TABLES[table]).select('*', { count: 'exact', head: true })
      if (error) throw new Error(error.message)
      return count || 0
    },
    async getSettings() {
      const data = check(await sb.from('settings').select('data').eq('id', 'platform').maybeSingle())
      return { ...DEFAULT_SETTINGS, ...(data?.data || {}) }
    },
    async saveSettings(settings) {
      check(await sb.from('settings').upsert({ id: 'platform', data: settings }))
      return settings
    },
    async recordSale({ id, shopId, items, paymentMethod, customerName }) {
      return fromRow(check(await sb.rpc('record_sale', { p_id: id, p_shop_id: shopId, p_items: items, p_payment_method: paymentMethod, p_customer_name: customerName })))
    },
    async voidSale(id, restock) {
      check(await sb.rpc('void_sale', { p_id: id, p_restock: restock }))
    },
    async incrementViews(id) {
      check(await sb.rpc('increment_product_views', { p_id: id }))
    },
  }
}

// ================================================================ JSON-file backend
function jsonRepo() {
  const DIR = path.resolve(process.env.DATA_DIR || 'server/data')
  const FILE = path.join(DIR, 'db.json')
  let data
  try {
    data = JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    data = {}
  }
  // older versions stored codes as an object keyed by email
  if (data.codes && !Array.isArray(data.codes)) data.codes = Object.entries(data.codes).map(([email, c]) => ({ email, ...c }))
  for (const t of Object.keys(TABLES)) data[t] = Array.isArray(data[t]) ? data[t] : []
  data.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) }
  data.secret = data.secret || crypto.randomBytes(32).toString('hex')

  const save = () => {
    fs.mkdirSync(DIR, { recursive: true })
    const tmp = `${FILE}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
    fs.renameSync(tmp, FILE)
  }
  const keyOf = (t) => (t === 'codes' ? 'email' : 'id')
  const match = (row, where = {}) => Object.entries(where).every(([k, v]) => (Array.isArray(v) ? v.includes(row[k]) : row[k] === v))
  const clone = (x) => (x ? JSON.parse(JSON.stringify(x)) : x)

  return {
    kind: 'local file (server/data/db.json)',
    secret: data.secret,
    async ready() {},
    async all(table, where, { order, limit } = {}) {
      let rows = data[table].filter((r) => match(r, where))
      if (order) {
        const k = order.replace(/^-/, '')
        const dir = order.startsWith('-') ? -1 : 1
        rows = [...rows].sort((a, b) => (a[k] > b[k] ? dir : a[k] < b[k] ? -dir : 0))
      }
      return clone(rows.slice(0, limit || 5000))
    },
    async get(table, id) {
      return clone(data[table].find((r) => r[keyOf(table)] === id) || null)
    },
    async findUserByEmail(email) {
      return clone(data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null)
    },
    async findUserByPhone(phone) {
      return clone(data.users.find((u) => u.phone && u.phone === phone) || null)
    },
    async findUserByUsername(username) {
      return clone(data.users.find((u) => u.username && u.username.toLowerCase() === username.toLowerCase()) || null)
    },
    async hasLoginColumns() {
      return true
    },
    async insert(table, obj) {
      const row = { createdAt: Date.now(), ...obj }
      if (table === 'activity') row.at = row.at || Date.now()
      data[table].push(row)
      save()
      return clone(row)
    },
    async upsert(table, obj) {
      const k = keyOf(table)
      const i = data[table].findIndex((r) => r[k] === obj[k])
      if (i > -1) data[table][i] = { ...data[table][i], ...obj }
      else data[table].push(obj)
      save()
      return clone(obj)
    },
    async update(table, id, patch) {
      const row = data[table].find((r) => r[keyOf(table)] === id)
      if (!row) return null
      Object.assign(row, patch)
      save()
      return clone(row)
    },
    async remove(table, id) {
      data[table] = data[table].filter((r) => r[keyOf(table)] !== id)
      save()
    },
    async removeWhere(table, where) {
      data[table] = data[table].filter((r) => !match(r, where))
      save()
    },
    async count(table) {
      return data[table].length
    },
    async getSettings() {
      return clone(data.settings)
    },
    async saveSettings(settings) {
      data.settings = settings
      save()
      return clone(settings)
    },
    async recordSale({ id, shopId, items, paymentMethod, customerName }) {
      let total = 0
      for (const it of items) {
        total += it.qty * it.price
        const p = data.products.find((x) => x.id === it.productId && x.shopId === shopId)
        if (p) p.stock = Math.max(0, (p.stock || 0) - it.qty)
      }
      const sale = { id, shopId, items, total, paymentMethod: paymentMethod || 'Cash', customerName: customerName || '', createdAt: Date.now() }
      data.sales.push(sale)
      save()
      return clone(sale)
    },
    async voidSale(id, restock) {
      const sale = data.sales.find((s) => s.id === id)
      if (!sale) return
      if (restock) {
        for (const it of sale.items) {
          const p = data.products.find((x) => x.id === it.productId && x.shopId === sale.shopId)
          if (p) p.stock += it.qty
        }
      }
      data.sales = data.sales.filter((s) => s.id !== id)
      save()
    },
    async incrementViews(id) {
      const p = data.products.find((x) => x.id === id)
      if (p) {
        p.views = (p.views || 0) + 1
        save()
      }
    },
  }
}

// ================================================================ choose backend
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
export const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
export const repo = usingSupabase ? supabaseRepo(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : jsonRepo()

/** First start on Supabase: copy accounts from the old local JSON file so nobody loses their login. */
export async function migrateLocalAccounts() {
  if (!usingSupabase) return 0
  const file = path.resolve(process.env.DATA_DIR || 'server/data', 'db.json')
  if (!fs.existsSync(file)) return 0
  let old
  try {
    old = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return 0
  }
  let copied = 0
  for (const u of old.users || []) {
    if (!u.passwordHash || u.role === 'admin') continue // the admin is re-created from .env
    if (await repo.findUserByEmail(u.email)) continue
    await repo.insert('users', {
      id: u.id,
      email: u.email,
      name: u.name || '',
      role: u.role === 'shop' ? 'shop' : 'customer',
      status: u.status || 'active',
      verified: !!u.verified,
      passwordHash: u.passwordHash,
      createdAt: u.createdAt || Date.now(),
    })
    copied++
  }
  return copied
}
