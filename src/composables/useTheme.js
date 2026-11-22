import { ref } from 'vue'

const KEY = 'fastop-theme'

function initial() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref(initial())
// Some pages (the landing page) are always shown light, whatever the saved theme is.
let lockedLight = false

function apply(t) {
  const shown = lockedLight ? 'light' : t
  document.documentElement.setAttribute('data-theme', shown)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', shown === 'dark' ? '#07110B' : '#86EFAC')
}
apply(theme.value)

// Force light while a page is open; the visitor's own choice comes back when it closes.
export function lockLightTheme(on) {
  lockedLight = on
  apply(theme.value)
}

export function useTheme() {
  function setTheme(t) {
    theme.value = t
    apply(t)
    try {
      localStorage.setItem(KEY, t)
    } catch {}
  }
  const toggle = () => setTheme(theme.value === 'dark' ? 'light' : 'dark')
  return { theme, setTheme, toggle }
}
