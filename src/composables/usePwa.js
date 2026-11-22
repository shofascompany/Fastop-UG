import { ref, computed } from 'vue'

const INSTALLED_KEY = 'fastop-installed'

function readFlag() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === '1'
  } catch {
    return false
  }
}
function writeFlag(on) {
  try {
    on ? localStorage.setItem(INSTALLED_KEY, '1') : localStorage.removeItem(INSTALLED_KEY)
  } catch {}
}

const standaloneQuery = typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)') : null
const isStandalone = ref(Boolean(standaloneQuery?.matches || window.navigator.standalone))
const installedFlag = ref(readFlag())
const deferredPrompt = ref(null)

const ua = navigator.userAgent
const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isSafariMac = !isIOS && /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua)
const isFirefox = /firefox|fxios/i.test(ua)
const isAndroid = /android/i.test(ua)

standaloneQuery?.addEventListener('change', (e) => (isStandalone.value = e.matches))

// Chromium browsers (Chrome, Edge, Samsung Internet, Opera...) hand us their install prompt.
// They only fire this when the app is NOT installed, so it also clears a stale "installed" flag.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt.value = e
  installedFlag.value = false
  writeFlag(false)
})

window.addEventListener('appinstalled', () => {
  deferredPrompt.value = null
  installedFlag.value = true
  writeFlag(true)
})

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const url = import.meta.env.DEV ? '/sw.js?dev=1' : '/sw.js'
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(url).catch((err) => console.warn('Service worker not registered:', err))
  })
}

export function usePwa() {
  const isInstalled = computed(() => isStandalone.value || installedFlag.value)
  const canPrompt = computed(() => Boolean(deferredPrompt.value))

  // How this browser installs apps, for when there's no one-click prompt.
  const manualSteps = computed(() => {
    if (isIOS) return 'Tap the Share button, then "Add to Home Screen".'
    if (isSafariMac) return 'In Safari, choose File, then "Add to Dock".'
    if (isFirefox && isAndroid) return 'Open the browser menu (⋮) and tap "Install".'
    if (isFirefox) return 'Firefox on computers can\'t install apps. Open this site in Chrome or Edge to install it.'
    return 'Open your browser menu and choose "Install Fastop" or "Add to Home screen".'
  })

  async function install() {
    const e = deferredPrompt.value
    if (!e) return 'manual'
    e.prompt()
    const { outcome } = await e.userChoice
    deferredPrompt.value = null
    return outcome // 'accepted' | 'dismissed'
  }

  return { isInstalled, canPrompt, manualSteps, install, isIOS, inApp: isStandalone }
}

/** True when the site is running as the installed app (its own window, no browser bar). */
export function runningAsApp() {
  return isStandalone.value
}
