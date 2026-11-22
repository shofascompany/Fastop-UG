// Fastop app data, backed by the API server (which stores everything in Supabase).
//
// - On start, the last copy is shown instantly from this device's cache, then
//   refreshed from the server with refresh().
// - Every action updates the screen immediately and then saves through the API.
//   If the server rejects a change, the error is shown and the data is reloaded,
//   so the screen never drifts away from the database.
import { defineStore } from 'pinia'
import { createSeed } from '@/data/seed'
import { uid, nameFromEmail } from '@/utils/format'
import { api } from '@/services/api'
import { toast } from '@/stores/toast'

const CACHE_KEY = 'fastop-cache-v3'

function cached() {
  try {
    localStorage.removeItem('fastop-db-v1')
    localStorage.removeItem('fastop-db-v2') // old browser-only database
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) return { ...createSeed(), ...JSON.parse(raw), loaded: false }
  } catch {}
  return { ...createSeed(), loaded: false }
}

/** Save to the API; on failure tell the user and resync with the server. */
function remote(store, action, body) {
  return api(`/data/${action}`, { method: 'POST', body }).catch((e) => {
    toast(e.message || 'Could not save. Please try again.', 'error')
    store.refresh()
    throw e
  })
}

export const useDb = defineStore('db', {
  state: cached,

  getters: {
    activeShopIds: (s) => new Set(s.shops.filter((x) => x.status === 'active').map((x) => x.id)),
    /** Products customers are allowed to see */
    publicProducts() {
      const ids = this.activeShopIds
      return this.products.filter((p) => p.visible && ids.has(p.shopId))
    },
    publicShops: (s) => s.shops.filter((x) => x.status === 'active'),
  },

  actions: {
    /** Load everything this person may see from the server. */
    async refresh() {
      try {
        const d = await api('/data', { timeout: 10000 })
        const users = d.users || []
        if (d.me) {
          const i = users.findIndex((u) => u.id === d.me.id)
          i > -1 ? (users[i] = { ...users[i], ...d.me }) : users.push(d.me)
        }
        this.$patch((s) => {
          s.settings = { ...createSeed().settings, ...d.settings }
          s.shops = d.shops || []
          s.products = d.products || []
          s.sales = d.sales || []
          s.expenses = d.expenses || []
          s.enquiries = d.enquiries || []
          s.activity = d.activity || []
          s.users = users.map((u) => ({ favorites: [], ...u }))
          s.loaded = true
        })
        this.persist()
      } catch (e) {
        if (!this.loaded) console.warn('Using cached data:', e.message)
      }
    },

    /** Cache the latest copy on this device for an instant start next time. */
    persist() {
      try {
        const { loaded, ...rest } = this.$state
        localStorage.setItem(CACHE_KEY, JSON.stringify(rest))
      } catch {}
    },

    /** Activity is written by the server; this only updates the screen. */
    log(type, message) {
      this.activity.unshift({ id: uid('log'), type, message, at: Date.now() })
    },

    // ---------- Users (accounts are managed by the API) ----------
    syncUser(server) {
      let u = this.users.find((x) => x.id === server.id)
      const fields = {
        email: server.email,
        name: server.name || nameFromEmail(server.email),
        role: server.role,
        status: server.status || 'active',
        username: server.username || null,
        phone: server.phone || null,
        onboarded: server.onboarded !== false,
      }
      if (u) Object.assign(u, fields)
      else {
        u = { id: server.id, ...fields, favorites: server.favorites || [], createdAt: server.createdAt || Date.now() }
        this.users.push(u)
      }
      return u
    },
    removeUserLocal(id) {
      const shopIds = this.shops.filter((s) => s.ownerId === id).map((s) => s.id)
      this.products = this.products.filter((p) => !shopIds.includes(p.shopId))
      this.shops = this.shops.filter((s) => s.ownerId !== id)
      this.enquiries = this.enquiries.filter((e) => e.customerId !== id && !shopIds.includes(e.shopId))
      this.users = this.users.filter((x) => x.id !== id)
    },
    clearLocal() {
      this.$patch((s) => {
        Object.assign(s, createSeed(), { settings: s.settings, loaded: false })
      })
      this.persist()
    },

    async toggleFavorite(userId, productId) {
      const u = this.users.find((x) => x.id === userId)
      if (!u) return
      u.favorites = u.favorites || []
      const i = u.favorites.indexOf(productId)
      i > -1 ? u.favorites.splice(i, 1) : u.favorites.push(productId)
      const res = await remote(this, 'toggleFavorite', { productId })
      u.favorites = res.favorites
    },

    // ---------- Shops ----------
    async updateShop(id, patch) {
      const s = this.shops.find((x) => x.id === id)
      if (s) Object.assign(s, patch)
      const res = await remote(this, 'updateShop', { id, patch })
      if (s) Object.assign(s, res.shop)
    },
    async deleteShop(id) {
      const productIds = new Set(this.products.filter((p) => p.shopId === id).map((p) => p.id))
      this.products = this.products.filter((p) => p.shopId !== id)
      this.sales = this.sales.filter((x) => x.shopId !== id)
      this.expenses = this.expenses.filter((x) => x.shopId !== id)
      this.enquiries = this.enquiries.filter((x) => x.shopId !== id)
      this.users.forEach((u) => (u.favorites = (u.favorites || []).filter((f) => !productIds.has(f))))
      this.shops = this.shops.filter((x) => x.id !== id)
      await remote(this, 'deleteShop', { id })
    },

    // ---------- Products ----------
    saveProduct(data) {
      let p
      if (data.id) {
        p = this.products.find((x) => x.id === data.id)
        if (p) Object.assign(p, data)
      } else {
        p = { visible: true, featured: false, image: '', views: 0, ...data, id: uid('prd'), createdAt: Date.now() }
        if (!p.sku) p.sku = p.id.toUpperCase().replace('_', '-').slice(0, 12)
        this.products.unshift(p)
      }
      remote(this, 'saveProduct', { product: { ...p } })
        .then((res) => Object.assign(this.products.find((x) => x.id === res.product.id) || {}, res.product))
        .catch(() => {})
      return p
    },
    updateProduct(id, patch) {
      const p = this.products.find((x) => x.id === id)
      if (p) Object.assign(p, patch)
      remote(this, 'updateProduct', { id, patch }).catch(() => {})
    },
    deleteProduct(id) {
      this.products = this.products.filter((x) => x.id !== id)
      this.users.forEach((u) => (u.favorites = (u.favorites || []).filter((f) => f !== id)))
      remote(this, 'deleteProduct', { id }).catch(() => {})
    },
    viewProduct(id) {
      const p = this.products.find((x) => x.id === id)
      if (p) p.views = (p.views || 0) + 1
      api('/data/viewProduct', { method: 'POST', body: { id } }).catch(() => {})
    },

    // ---------- Sales ----------
    recordSale({ shopId, items, paymentMethod, customerName }) {
      const total = items.reduce((a, x) => a + x.qty * x.price, 0)
      items.forEach((it) => {
        const p = this.products.find((x) => x.id === it.productId)
        if (p) p.stock = Math.max(0, (p.stock || 0) - it.qty)
      })
      const sale = { id: uid('sal'), shopId, items, total, paymentMethod, customerName: customerName || '', createdAt: Date.now() }
      this.sales.unshift(sale)
      remote(this, 'recordSale', sale).catch(() => {})
      return sale
    },
    deleteSale(id, restock = true) {
      const sale = this.sales.find((x) => x.id === id)
      if (!sale) return
      if (restock) {
        sale.items.forEach((it) => {
          const p = this.products.find((x) => x.id === it.productId)
          if (p) p.stock += it.qty
        })
      }
      this.sales = this.sales.filter((x) => x.id !== id)
      remote(this, 'deleteSale', { id, restock }).catch(() => {})
    },

    // ---------- Expenses ----------
    addExpense(e) {
      const expense = { ...e, id: uid('exp') }
      this.expenses.push(expense)
      remote(this, 'addExpense', { expense }).catch(() => {})
    },
    deleteExpense(id) {
      this.expenses = this.expenses.filter((x) => x.id !== id)
      remote(this, 'deleteExpense', { id }).catch(() => {})
    },

    // ---------- Enquiries ----------
    addEnquiry({ shopId, productId, customerId, message }) {
      const enquiry = { id: uid('enq'), shopId, productId, customerId, message, reply: '', status: 'new', createdAt: Date.now() }
      this.enquiries.unshift(enquiry)
      remote(this, 'addEnquiry', enquiry).catch(() => {})
    },
    replyEnquiry(id, reply) {
      const e = this.enquiries.find((x) => x.id === id)
      if (e) Object.assign(e, { reply, status: 'replied', repliedAt: Date.now() })
      remote(this, 'replyEnquiry', { id, reply }).catch(() => {})
    },
    deleteEnquiry(id) {
      this.enquiries = this.enquiries.filter((x) => x.id !== id)
      remote(this, 'deleteEnquiry', { id }).catch(() => {})
    },

    // ---------- Platform ----------
    updateSettings(patch) {
      Object.assign(this.settings, patch)
      remote(this, 'updateSettings', { patch })
        .then((res) => Object.assign(this.settings, res.settings))
        .catch(() => {})
    },
    clearActivity() {
      this.activity = []
      remote(this, 'clearActivity', {}).catch(() => {})
    },
    /** Admin: delete every shop, product, sale, expense and enquiry (accounts stay). */
    async resetPlatform() {
      await remote(this, 'resetPlatform', {})
      await this.refresh()
    },
  },
})
