import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router, { prefetchPages } from './router'
import { useDb } from './stores/db'
import './composables/useTheme'
import { registerServiceWorker } from './composables/usePwa'

import 'leaflet/dist/leaflet.css'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// App data comes from the Fastop API (stored in Supabase). The last copy is cached on
// this device so pages paint instantly; refresh() brings in the live data without
// blocking the first page.
const db = useDb()
db.refresh()

// Keep every screen in step with the database: refresh when the app comes back to the
// front, and every 30 s while it's open (new enquiries, sales from another device, approvals…).
let lastRefresh = Date.now()
const syncNow = () => {
  if (document.visibilityState !== 'visible' || Date.now() - lastRefresh < 10_000) return
  lastRefresh = Date.now()
  db.refresh()
}
document.addEventListener('visibilitychange', syncNow)
window.addEventListener('focus', syncNow)
window.addEventListener('online', () => {
  lastRefresh = 0
  syncNow()
})
setInterval(syncNow, 30_000)
let saveTimer = null
db.$subscribe(
  () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => db.persist(), 400)
  },
  { detached: true },
)

app.use(router)
// Keep the instant start-up screen from index.html until the first page is ready,
// so there is never a blank flash between the loader and the page.
router.isReady().then(() => {
  app.mount('#app')
  prefetchPages()
})

registerServiceWorker()
