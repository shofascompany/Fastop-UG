import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { runningAsApp } from '@/composables/usePwa'
// The landing page is part of the main bundle (not lazy) so it opens with no extra download.
import LandingPage from '@/views/LandingPage.vue'

// Every page has its own entrance animation (meta.transition). The styles live in
// src/assets/main.css under "Page transitions": fade, rise, slide, zoom, blur, flip,
// drop, swing, reveal, tilt, slide-up.
const routes = [
  // public
  { path: '/', name: 'landing', component: LandingPage, meta: { title: '', transition: 'fade' } },
  { path: '/about', name: 'about', component: () => import('@/views/AboutPage.vue'), meta: { title: 'About', transition: 'rise' } },
  { path: '/auth', name: 'auth', component: () => import('@/views/AuthPage.vue'), meta: { title: 'Sign in', guestOnly: true, transition: 'slide-up' } },
  { path: '/verify', name: 'verify', component: () => import('@/views/VerifyEmail.vue'), meta: { title: 'Confirm your email', guestOnly: true, needsPending: true, transition: 'zoom' } },
  // Shop registered by the Control Centre, first sign-in: choose username + password, then the walkthrough
  { path: '/setup', name: 'setup', component: () => import('@/views/SetupAccount.vue'), meta: { title: 'Set up your login', guestOnly: true, needsSetup: true, transition: 'zoom' } },
  { path: '/welcome', name: 'welcome', component: () => import('@/views/WelcomeTour.vue'), meta: { title: 'Welcome', roles: ['shop'], transition: 'rise' } },

  // Control Centre
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { roles: ['admin'], transition: 'blur' },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { title: 'Overview', transition: 'rise' } },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsers.vue'), meta: { title: 'Users', transition: 'slide' } },
      { path: 'shops', name: 'admin-shops', component: () => import('@/views/admin/AdminShops.vue'), meta: { title: 'Shops', transition: 'zoom' } },
      { path: 'products', name: 'admin-products', component: () => import('@/views/admin/AdminProducts.vue'), meta: { title: 'Products', transition: 'flip' } },
      { path: 'activity', name: 'admin-activity', component: () => import('@/views/admin/AdminActivity.vue'), meta: { title: 'Activity log', transition: 'drop' } },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/AdminSettings.vue'), meta: { title: 'Platform settings', transition: 'blur' } },
    ],
  },

  // shop owners
  {
    path: '/shop',
    component: () => import('@/layouts/ShopLayout.vue'),
    meta: { roles: ['shop', 'admin'], transition: 'reveal' },
    children: [
      { path: '', name: 'shop-dashboard', component: () => import('@/views/shop/ShopDashboard.vue'), meta: { title: 'Dashboard', transition: 'rise' } },
      { path: 'products', name: 'shop-products', component: () => import('@/views/shop/ShopProducts.vue'), meta: { title: 'Inventory', transition: 'flip' } },
      { path: 'pos', name: 'shop-pos', component: () => import('@/views/shop/ShopPOS.vue'), meta: { title: 'Point of sale', transition: 'zoom' } },
      { path: 'sales', name: 'shop-sales', component: () => import('@/views/shop/ShopSales.vue'), meta: { title: 'Sales', transition: 'slide' } },
      { path: 'expenses', name: 'shop-expenses', component: () => import('@/views/shop/ShopExpenses.vue'), meta: { title: 'Expenses', transition: 'drop' } },
      { path: 'enquiries', name: 'shop-enquiries', component: () => import('@/views/shop/ShopEnquiries.vue'), meta: { title: 'Enquiries', transition: 'swing' } },
      { path: 'profile', name: 'shop-profile', component: () => import('@/views/shop/ShopProfile.vue'), meta: { title: 'Shop profile', transition: 'reveal' } },
    ],
  },

  // customers
  {
    path: '/explore',
    component: () => import('@/layouts/CustomerLayout.vue'),
    meta: { transition: 'fade' },
    // browsing is open to guests; only saved items and enquiries need an account
    children: [
      { path: '', name: 'explore-home', component: () => import('@/views/customer/ExploreHome.vue'), meta: { title: 'Discover', transition: 'rise' } },
      { path: 'products', name: 'explore-products', component: () => import('@/views/customer/ExploreProducts.vue'), meta: { title: 'Products', transition: 'flip' } },
      { path: 'products/:id', name: 'explore-product', component: () => import('@/views/customer/ProductDetail.vue'), meta: { title: 'Product', transition: 'zoom' } },
      { path: 'shops', name: 'explore-shops', component: () => import('@/views/customer/ExploreShops.vue'), meta: { title: 'Shops', transition: 'slide' } },
      { path: 'shops/:id', name: 'explore-shop', component: () => import('@/views/customer/ShopDetail.vue'), meta: { title: 'Shop', transition: 'reveal' } },
      { path: 'map', name: 'explore-map', component: () => import('@/views/customer/ExploreMap.vue'), meta: { title: 'Map', transition: 'blur' } },
      { path: 'saved', name: 'explore-saved', component: () => import('@/views/customer/SavedProducts.vue'), meta: { title: 'Saved', roles: ['customer', 'shop', 'admin'], transition: 'swing' } },
      { path: 'enquiries', name: 'explore-enquiries', component: () => import('@/views/customer/MyEnquiries.vue'), meta: { title: 'My enquiries', roles: ['customer', 'shop', 'admin'], transition: 'drop' } },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue'), meta: { title: 'Page not found', transition: 'tilt' } },
]

/**
 * The ?redirect= value after sign-in. Only in-app paths are accepted ("/explore/saved"),
 * never another website ("//evil.com", "https://…") or the sign-in pages themselves.
 */
export function safeRedirect(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  if (/^\/(auth|verify|setup|welcome)(\/|\?|#|$)/.test(value)) return null
  return value
}

// Pages enter with an out-in animation, so the new page is not in the document at the
// moment the router scrolls. Wait (briefly) until it is, then scroll.
function whenPageReady(test, maxMs = 1200) {
  return new Promise((resolve) => {
    const start = performance.now()
    const check = () => (test() || performance.now() - start > maxMs ? resolve() : requestAnimationFrame(check))
    requestAnimationFrame(check)
  })
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  async scrollBehavior(to, from, saved) {
    if (saved) {
      // back/forward: restore once the page is tall enough to scroll there
      await whenPageReady(() => document.documentElement.scrollHeight >= saved.top + window.innerHeight)
      return saved
    }
    if (to.hash) {
      let el = null
      try {
        await whenPageReady(() => (el = document.querySelector(to.hash)))
      } catch {} // not a valid CSS selector
      return el ? { el, top: 80, behavior: 'smooth' } : { top: 0 }
    }
    // same page, only the query changed (search, filters): keep the scroll position
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

const pickRole = (to) => (to.path.startsWith('/shop') ? { role: 'shop' } : {})

router.beforeEach(async (to, from) => {
  const auth = useAuth()
  await auth.init() // instant when there is no session or it is cached on this device

  // The installed app never shows the landing page: straight to sign-in, or home if signed in.
  if (to.name === 'landing' && runningAsApp()) return auth.user ? auth.homeRoute : { name: 'auth' }

  // Guests: every button on the landing page leads to sign in first, then on to where it pointed
  // (in-page anchors like "#how" stay on the page; "Login" / "List your shop" already go to sign in).
  if (!auth.user && from.name === 'landing' && to.path !== '/' && !['auth', 'verify', 'setup'].includes(to.name)) {
    return { name: 'auth', query: { ...pickRole(to), redirect: to.fullPath } }
  }

  // The verify page only makes sense while a code is waiting for an email.
  if (to.meta.needsPending && !auth.pendingEmail && !auth.user) return { name: 'auth', query: to.query }
  // The setup page only makes sense right after a registered shop owner entered their code.
  if (to.meta.needsSetup && !auth.setup?.setupToken && !auth.user) return { name: 'auth' }

  // A shop owner sees the welcome walkthrough once, before anything else in the Shop Manager.
  if (auth.needsTour && to.path.startsWith('/shop')) return { name: 'welcome' }
  if (to.name === 'welcome' && auth.user && !auth.needsTour) return auth.homeRoute

  const guarded = [...to.matched].reverse().find((r) => r.meta.roles)
  if (guarded) {
    if (!auth.user) return { name: 'auth', query: { redirect: to.fullPath } }
    // Roles come from the server; only the Control Centre account has 'admin'.
    if (!guarded.meta.roles.includes(auth.user.role)) return auth.homeRoute
  }
  // Already signed in on the sign-in pages: go where they were heading, or home.
  if (to.meta.guestOnly && auth.user) return safeRedirect(to.query.redirect) || auth.homeRoute
})

router.afterEach((to, from, failure) => {
  if (failure) return
  document.title = to.meta.title ? `${to.meta.title} · Fastop UG` : 'Fastop UG'
  try {
    sessionStorage.removeItem(`fastop-reload:${to.fullPath}`)
  } catch {}
})

// After a new version is deployed, an open tab may ask for page files that no longer exist.
// Load the page fresh instead of leaving the user stuck (once per page, so it can't loop).
router.onError((err, to) => {
  const stale = /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i.test(err?.message || '')
  if (!stale || !to) return
  const key = `fastop-reload:${to.fullPath}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {}
  window.location.assign(to.fullPath)
})

/**
 * After the first page is showing, quietly download the code for the other pages
 * so later navigation is instant. Skipped when the user has "Data saver" on.
 */
export function prefetchPages() {
  const conn = navigator.connection
  if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return
  const loaders = []
  const collect = (list) =>
    list.forEach((r) => {
      if (typeof r.component === 'function') loaders.push(r.component)
      if (r.children) collect(r.children)
    })
  collect(routes)
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300))
  let i = 0
  const next = () => {
    if (i >= loaders.length) return
    loaders[i++]().catch(() => {})
    idle(next)
  }
  setTimeout(() => idle(next), 1200)
}

export default router
