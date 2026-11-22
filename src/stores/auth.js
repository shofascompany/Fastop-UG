// Sign-in, sign-up and email verification, backed by the Fastop API server.
// One form does everything: an existing email signs in, a new email creates the
// account and asks for the 6-digit code that the server emails to that address.
import { defineStore } from 'pinia'
import { useDb } from './db'
import { api, tokenStore } from '@/services/api'

const SESSION_KEY = 'fastop-session'
const PENDING_KEY = 'fastop-pending-email'
const SETUP_KEY = 'fastop-setup' // short-lived ticket between the code and the username/password page
const ADMIN_SHOP_KEY = 'fastop-admin-shop'

function read(storage, key) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}
function write(storage, key, value) {
  try {
    value == null ? storage.removeItem(key) : storage.setItem(key, value)
  } catch {}
}

let initPromise = null

export const useAuth = defineStore('auth', {
  state: () => ({
    userId: tokenStore.get() ? read(localStorage, SESSION_KEY) : null,
    pendingEmail: read(sessionStorage, PENDING_KEY),
    setup: (() => {
      try {
        return JSON.parse(read(sessionStorage, SETUP_KEY) || 'null')
      } catch {
        return null
      }
    })(),
    adminShopId: read(sessionStorage, ADMIN_SHOP_KEY),
    ready: false,
    signedOutByUser: false,
  }),

  getters: {
    user(state) {
      const u = useDb().users.find((x) => x.id === state.userId)
      return u && u.status === 'active' ? u : null
    },
    /** A shop owner who hasn't seen the welcome walkthrough yet. */
    needsTour() {
      return this.user?.role === 'shop' && this.user.onboarded === false
    },
    homeRoute() {
      switch (this.user?.role) {
        case 'admin':
          return { name: 'admin-dashboard' }
        case 'shop':
          return this.needsTour ? { name: 'welcome' } : { name: 'shop-dashboard' }
        case 'customer':
          return { name: 'explore-home' }
        default:
          return { name: 'landing' }
      }
    },
  },

  actions: {
    /**
     * Restore the session once per page load without slowing the first page:
     * - no saved token: nothing to check, open immediately
     * - token + account already on this device: open immediately, re-check with the server in the background
     * - token but no local copy (new device): wait for the server, at most 2.5 s
     */
    init() {
      if (initPromise) return initPromise
      const token = tokenStore.get()
      if (!token) {
        this.ready = true
        return (initPromise = Promise.resolve())
      }
      const check = api('/auth/me', { timeout: 2500 })
        .then(({ user }) => this.applyUser(user))
        .catch((e) => {
          if (e.status === 401) this.logout() // token expired or revoked
          // offline / slow: keep the cached session so the app still opens
        })
        .finally(() => (this.ready = true))
      initPromise = this.user ? Promise.resolve() : check
      return initPromise
    },

    /**
     * Email + password. Returns 'done' when signed in, or 'verify' when the
     * account still needs its emailed code (new accounts always do).
     */
    /**
     * Who is this? Called as soon as the sign-in box holds a complete email, phone number or username.
     * Resolves to { status: 'existing' | 'setup' | 'new' | 'unknown' | 'suspended' | 'invalid', name?, shopName?, sentTo? }.
     * For 'setup' the server has already emailed the owner their code.
     */
    lookup(identifier) {
      return api('/auth/lookup', { method: 'POST', body: { identifier } })
    },

    /** Shop owner's first sign-in: check the emailed code, then hold the setup ticket for the next page. */
    async setupVerify(identifier, code) {
      const data = await api('/auth/setup/verify', { method: 'POST', body: { identifier, code } })
      this.setup = { ...data, identifier }
      write(sessionStorage, SETUP_KEY, JSON.stringify(this.setup))
      return data
    },

    resendSetup(identifier) {
      return api('/auth/resend', { method: 'POST', body: { identifier } })
    },

    /** Username + password chosen: the account is ready, sign straight in. */
    async setupComplete({ username, password }) {
      const data = await api('/auth/setup/complete', { method: 'POST', body: { setupToken: this.setup?.setupToken, username, password } })
      this.setup = null
      write(sessionStorage, SETUP_KEY, null)
      await this.signIn(data)
    },

    /** The welcome walkthrough has been seen; never show it again. */
    async finishTour() {
      if (this.user) this.user.onboarded = true
      try {
        const { user } = await api('/auth/onboarded', { method: 'POST' })
        this.applyUser(user)
      } catch {
        // offline: the local flag already lets them through; the server catches up next sign-in
      }
    },

    async continue({ identifier, email, password }) {
      const data = await api('/auth/continue', { method: 'POST', body: { identifier: identifier ?? email, password } })
      if (data.next === 'verify') {
        this.pendingEmail = data.email
        write(sessionStorage, PENDING_KEY, data.email)
        return { next: 'verify', created: !!data.created }
      }
      await this.signIn(data)
      return { next: 'done' }
    },

    async verify(code) {
      const data = await api('/auth/verify', { method: 'POST', body: { email: this.pendingEmail, code } })
      this.pendingEmail = null
      write(sessionStorage, PENDING_KEY, null)
      await this.signIn(data)
    },

    resend() {
      return api('/auth/resend', { method: 'POST', body: { email: this.pendingEmail } })
    },

    cancelPending() {
      this.pendingEmail = null
      write(sessionStorage, PENDING_KEY, null)
    },

    /** Save the session, then load this account's shops, sales, favourites… before opening their dashboard. */
    async signIn({ token, user }) {
      tokenStore.set(token)
      const db = useDb()
      db.loaded = false
      this.applyUser(user)
      await db.refresh()
    },

    /** Mirror the server account into the local app data (shops, favourites…). */
    applyUser(user) {
      this.signedOutByUser = false
      useDb().syncUser(user)
      this.userId = user.id
      write(localStorage, SESSION_KEY, user.id)
    },

    /**
     * @param {{ byUser?: boolean }} opts  byUser: the person pressed "Sign out", so the
     *   screen that called this decides where to go (App.vue only redirects on expiry).
     */
    logout({ byUser = false } = {}) {
      this.signedOutByUser = byUser
      tokenStore.clear()
      this.userId = null
      write(localStorage, SESSION_KEY, null)
      // drop this account's private data from the screen and cache, then load the public view
      const db = useDb()
      db.clearLocal()
      db.refresh()
    },

    setAdminShop(id) {
      this.adminShopId = id
      write(sessionStorage, ADMIN_SHOP_KEY, id)
    },
  },
})
