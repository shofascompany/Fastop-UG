<template>
  <div class="auth">
    <!-- Brand side -->
    <aside class="auth-brand">
      <PhotoWall :cols="4" :speed="80" />
      <div class="brand-shade" aria-hidden="true"></div>

      <div class="brand-top">
        <component :is="inApp ? 'span' : RouterLink" to="/" aria-label="Fastop"><AppLogo :size="46" light tagline /></component>
      </div>

      <div class="brand-copy">
        <span class="eyebrow"><span class="dot"></span> {{ role === 'shop' ? 'For shop owners' : 'For shoppers' }}</span>
        <Transition name="swap" mode="out-in">
          <div :key="role">
            <h2>{{ copy.title }}</h2>
            <p>{{ copy.text }}</p>
          </div>
        </Transition>

        <ul class="features">
          <li v-for="f in copy.features" :key="f.title">
            <span class="f-ico"><AppIcon :name="f.icon" :size="18" /></span>
            <span>
              <b>{{ f.title }}</b>
              <small>{{ f.text }}</small>
            </span>
          </li>
        </ul>
      </div>

      <div class="brand-foot">
        <small>© {{ year }} Fastop</small>
        <nav v-if="!inApp">
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/">Home</RouterLink>
        </nav>
      </div>
    </aside>

    <!-- Form side -->
    <main class="auth-main">
      <div class="main-top" :class="{ 'in-app': inApp }">
        <!-- Phones: the logo sits on the left (it is the way home). The installed app has no landing page, so there it is not a link. -->
        <component :is="inApp ? 'span' : RouterLink" to="/" class="mobile-logo" aria-label="Fastop home"><AppLogo :size="34" /></component>
        <RouterLink v-if="!inApp" to="/" class="back"><AppIcon name="arrowLeft" :size="16" /> Home</RouterLink>
      </div>

      <form class="auth-card" @submit.prevent="submit" novalidate>
        <!-- Sign in / Sign up: one form, but it always says clearly which one you're doing -->
        <div v-if="mode !== 'setup'" class="modes" role="tablist" aria-label="Sign in or sign up" style="--i: 0">
          <span class="mode-thumb" :class="{ right: mode === 'signup' }" aria-hidden="true"></span>
          <button type="button" role="tab" :aria-selected="mode === 'signin'" :class="{ on: mode === 'signin' }" @click="setMode('signin')">
            <AppIcon name="lock" :size="16" /> Sign in
          </button>
          <button type="button" role="tab" :aria-selected="mode === 'signup'" :class="{ on: mode === 'signup' }" @click="setMode('signup')">
            <AppIcon name="user" :size="16" /> Sign up
          </button>
        </div>
        <div v-else class="setup-badge" style="--i: 0"><AppIcon name="store" :size="16" /> Shop setup</div>

        <header class="card-head" style="--i: 1">
          <Transition name="word" mode="out-in">
            <h1 :key="heading">{{ heading }}</h1>
          </Transition>
          <Transition name="word" mode="out-in">
            <p :key="subheading" class="sub">{{ subheading }}</p>
          </Transition>
        </header>

        <Transition name="note">
          <p v-if="switchNote" class="switch-note" role="status"><AppIcon name="info" :size="15" /> {{ switchNote }}</p>
        </Transition>

        <!-- One box for everyone: email, phone number or username. Checked automatically as you type. -->
        <div class="field" style="--i: 2">
          <Transition name="word" mode="out-in">
            <label :key="idLabel" for="identifier">{{ idLabel }}</label>
          </Transition>
          <div class="control" :class="{ invalid: fieldErr === 'identifier' }">
            <AppIcon :name="idIcon" :size="18" class="lead-ico" />
            <input
              id="identifier"
              ref="idEl"
              v-model.trim="identifier"
              type="text"
              autocomplete="username"
              autocapitalize="off"
              spellcheck="false"
              :placeholder="mode === 'signup' ? 'you@gmail.com' : 'you@gmail.com, 0726 128 782 or username'"
              :aria-invalid="fieldErr === 'identifier'"
              aria-describedby="who"
              required
              @input="onIdentifierInput"
              @blur="checkNow"
            />
            <span v-if="checking" class="trail"><AppLoader variant="inline" /></span>
            <span v-else-if="who.status === 'existing' || who.status === 'setup'" class="trail ok"><AppIcon name="check" :size="18" /></span>
          </div>
          <Transition name="fade" mode="out-in">
            <p v-if="whoLine" id="who" :key="whoLine" class="who" :class="whoTone">
              <AppIcon :name="whoTone === 'bad' ? 'alert' : who.status === 'setup' ? 'store' : 'user'" :size="14" /> {{ whoLine }}
            </p>
          </Transition>
        </div>

        <!-- First sign-in of a shop registered by Fastop: a code instead of a password -->
        <div v-if="who.status === 'setup'" class="field" style="--i: 3">
          <label for="code">6-digit code</label>
          <div class="control code-control" :class="{ invalid: fieldErr === 'code' }">
            <AppIcon name="mail" :size="18" class="lead-ico" />
            <input
              id="code"
              ref="codeEl"
              v-model="code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="••••••"
              :aria-invalid="fieldErr === 'code'"
              @input="onCodeInput"
            />
          </div>
          <p class="hint muted-hint">
            Sent to {{ who.sentTo }}.
            <button type="button" class="link-btn" :disabled="resendIn > 0" @click="resend">{{ resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code' }}</button>
          </p>
        </div>

        <div v-else class="field" style="--i: 3">
          <Transition name="word" mode="out-in">
            <label :key="pwLabel" for="password">{{ pwLabel }}</label>
          </Transition>
          <div class="control" :class="{ invalid: fieldErr === 'password' }">
            <AppIcon name="lock" :size="18" class="lead-ico" />
            <input
              id="password"
              v-model="password"
              :type="show ? 'text' : 'password'"
              :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
              :placeholder="mode === 'signup' ? 'At least 6 characters' : 'Your password'"
              :aria-invalid="fieldErr === 'password'"
              required
              @input="clearErr"
              @keyup="checkCaps"
              @keydown="checkCaps"
              @blur="caps = false"
            />
            <button type="button" class="eye" @click="show = !show" :aria-label="show ? 'Hide password' : 'Show password'">
              <AppIcon :name="show ? 'eyeOff' : 'eye'" :size="18" />
            </button>
          </div>
          <p v-if="caps" class="hint"><AppIcon name="alert" :size="14" /> Caps Lock is on</p>
          <p v-else-if="mode === 'signup'" class="hint muted-hint">Use at least 6 characters. We'll email you a code to confirm your address.</p>
        </div>

        <Transition name="fade">
          <div v-if="error" class="alert danger" role="alert"><AppIcon name="alert" :size="18" /> {{ error }}</div>
        </Transition>

        <button class="btn btn-primary btn-lg btn-block submit" :disabled="loading" style="--i: 4">
          <template v-if="loading"><AppLoader variant="inline" /> Please wait</template>
          <Transition v-else name="word" mode="out-in">
            <span :key="buttonText" class="btn-label">{{ buttonText }} <AppIcon name="arrowRight" :size="18" /></span>
          </Transition>
        </button>

        <p v-if="mode !== 'setup'" class="alt" style="--i: 5">
          <template v-if="mode === 'signin'">New to Fastop? <button type="button" class="link-btn" @click="setMode('signup')">Create an account</button></template>
          <template v-else>Already have an account? <button type="button" class="link-btn" @click="setMode('signin')">Sign in</button></template>
        </p>

      </form>

      <p class="main-foot">
        <a v-if="supportEmail" :href="`mailto:${supportEmail}`"><AppIcon name="message" :size="15" /> Need help?</a>
        <RouterLink v-else to="/about#faq"><AppIcon name="message" :size="15" /> Need help?</RouterLink>
      </p>
    </main>

    <AppLoader v-if="loading" variant="overlay" :text="loadingText" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { usePwa } from '@/composables/usePwa'
import { useRoute, useRouter } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'
import AppIcon from '@/components/AppIcon.vue'
import AppLoader from '@/components/AppLoader.vue'
import PhotoWall from '@/components/PhotoWall.vue'
import { useAuth } from '@/stores/auth'
import { useDb } from '@/stores/db'
import { isEmail } from '@/utils/format'
import { toast } from '@/stores/toast'
import { safeRedirect } from '@/router'

const auth = useAuth()
const route = useRoute()
const router = useRouter()

const { inApp } = usePwa()

const identifier = ref(auth.pendingEmail || '')
const password = ref('')
const code = ref('')
const show = ref(false)
const caps = ref(false)
const error = ref('')
const fieldErr = ref('')
const loading = ref(false)
const loadingText = ref('Signing you in')
const idEl = ref(null)
const codeEl = ref(null)
const year = new Date().getFullYear()

// ---------- who is typing? ----------
// status: '' (not checked yet) | existing | setup | new | unknown | suspended | invalid
const who = ref({ status: '' })
const checking = ref(false)
let checkedFor = ''
let debounce = null
let seq = 0

const looksPhone = (v) => /^[+\d][\d\s()-]{6,}$/.test(v)
const phoneDigits = (v) => v.replace(/\D/g, '')
/** Only ask the server once the entry looks finished, so we don't check "jo", "joh", "john"… */
function looksComplete(v) {
  if (!v) return false
  if (v.includes('@')) return isEmail(v)
  if (looksPhone(v)) return phoneDigits(v).length >= 9
  return /^[a-z0-9][a-z0-9._]{2,29}$/i.test(v)
}

async function check(value) {
  if (!looksComplete(value) || value === checkedFor) return
  checkedFor = value
  const mine = ++seq
  checking.value = true
  try {
    const res = await auth.lookup(value)
    if (mine !== seq) return // a newer entry is being checked
    who.value = res
    if (res.status === 'setup') {
      startResendTimer()
      await nextTick()
      codeEl.value?.focus()
    }
  } catch (e) {
    if (mine === seq) {
      who.value = { status: '' }
      checkedFor = ''
      error.value = e.message
    }
  } finally {
    if (mine === seq) checking.value = false
  }
}

function onIdentifierInput() {
  clearErr()
  if (identifier.value !== checkedFor) {
    who.value = { status: '' }
    code.value = ''
  }
  clearTimeout(debounce)
  // emails and phone numbers are recognisable as finished; usernames get a slightly longer pause
  const wait = identifier.value.includes('@') || looksPhone(identifier.value) ? 450 : 800
  debounce = setTimeout(() => check(identifier.value), wait)
}
function checkNow() {
  clearTimeout(debounce)
  check(identifier.value)
}

const role = computed(() => (who.value.status === 'setup' || who.value.role === 'shop' ? 'shop' : 'customer'))

const kindWord = computed(() => (who.value.kind === 'phone' ? 'phone number' : who.value.kind === 'username' ? 'username' : 'email'))
const whoLine = computed(() => {
  const w = who.value
  switch (w.status) {
    case 'existing':
      return `Welcome back${w.name ? `, ${w.name}` : ''}. Enter your password.`
    case 'setup':
      return `${w.shopName || 'Your shop'} is registered on Fastop${w.name ? `, ${w.name}` : ''}. Enter the code we just emailed you.`
    case 'new':
      return "New here? Choose a password and we'll create your shopper account."
    case 'unknown':
      return `No account uses that ${kindWord.value}. Check it, or use your email.`
    case 'suspended':
      return 'This account is suspended. Please contact Fastop support.'
    default:
      return ''
  }
})
const whoTone = computed(() => (['unknown', 'suspended'].includes(who.value.status) ? 'bad' : 'good'))
const idIcon = computed(() => (identifier.value.includes('@') ? 'mail' : looksPhone(identifier.value) ? 'phone' : 'user'))

// ---------- Sign in or Sign up? ----------
// The person can pick a tab, but once we recognise what they typed, the facts win:
// a known account is always "Sign in", an unknown email is always "Sign up".
const intended = ref(route.query.mode === 'signup' ? 'signup' : 'signin')
const mode = computed(() => {
  switch (who.value.status) {
    case 'setup':
      return 'setup'
    case 'existing':
    case 'suspended':
      return 'signin'
    case 'new':
      return 'signup'
    default:
      return intended.value
  }
})
function setMode(m) {
  intended.value = m
  clearErr()
  nextTick(() => idEl.value?.focus())
}
// Explain when the form switched tabs on its own, so nobody wonders what happened.
const switchNote = computed(() => {
  if (who.value.status === 'existing' && intended.value === 'signup') return 'You already have an account with this, so we switched you to Sign in.'
  if (who.value.status === 'new' && intended.value === 'signin') return "There's no account for this email yet. Choose a password to sign up."
  return ''
})

const heading = computed(() => ({ setup: 'Set up your shop', signup: 'Create your account', signin: 'Welcome back' })[mode.value])
const subheading = computed(
  () =>
    ({
      setup: 'Enter the code we emailed you, then choose your login.',
      signup: "Join Fastop free. It takes less than a minute.",
      signin: 'Sign in with your email, phone number or username.',
    })[mode.value],
)
const idLabel = computed(() => (mode.value === 'signup' ? 'Email address' : 'Email, phone or username'))
const pwLabel = computed(() => (mode.value === 'signup' ? 'Create a password' : 'Password'))
const db = useDb()
const supportEmail = computed(() => db.settings?.supportEmail || '')
const buttonText = computed(
  () => ({ setup: 'Verify code', signup: 'Create account', signin: 'Sign in' })[mode.value],
)

// ---------- first sign-in of a registered shop: the code ----------
const resendIn = ref(0)
let resendTimer = null
function startResendTimer() {
  resendIn.value = 60
  clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendIn.value = Math.max(0, resendIn.value - 1)
    if (!resendIn.value) clearInterval(resendTimer)
  }, 1000)
}
async function resend() {
  try {
    await auth.resendSetup(identifier.value)
    toast(`A new code is on its way to ${who.value.sentTo}`, 'info')
    startResendTimer()
  } catch (e) {
    error.value = e.message
  }
}
function onCodeInput() {
  clearErr()
  code.value = code.value.replace(/\D/g, '').slice(0, 6)
  if (code.value.length === 6) submit() // no button press needed
}
onBeforeUnmount(() => {
  clearTimeout(debounce)
  clearInterval(resendTimer)
})

const COPY = {
  customer: {
    image: '/img/market.jpg',
    title: 'Know it’s on the shelf before you leave home.',
    text: 'Search real stock across shops near you, compare distance and opening hours, and go straight to the one that has it.',
    features: [
      { icon: 'search', title: 'Search every shop at once', text: 'Supermarkets, boutiques, pharmacies and more.' },
      { icon: 'heart', title: 'Save what you want', text: 'Keep a list of products to come back to.' },
      { icon: 'message', title: 'Ask before you go', text: 'Message a shop about price or availability.' },
    ],
  },
  shop: {
    image: '/img/boutique.jpg',
    title: 'Put your shelves in front of nearby shoppers.',
    text: 'List your products, keep stock up to date, and let customers find you when they’re looking for what you sell.',
    features: [
      { icon: 'store', title: 'Your shop on the map', text: 'Location, hours and directions to your door.' },
      { icon: 'cart', title: 'Products and stock', text: 'Manage your catalogue from the Shop Manager.' },
      { icon: 'message', title: 'Customer messages', text: 'Answer questions from shoppers in one inbox.' },
    ],
  },
}
const copy = computed(() => COPY[role.value])

onMounted(() => {
  idEl.value?.focus()
  if (identifier.value) check(identifier.value)
})

function clearErr() {
  if (error.value) {
    error.value = ''
    fieldErr.value = ''
  }
}
function checkCaps(e) {
  caps.value = !!e.getModifierState?.('CapsLock')
}

async function submit() {
  if (loading.value) return
  error.value = ''
  fieldErr.value = ''
  if (!looksComplete(identifier.value)) {
    fieldErr.value = 'identifier'
    return (error.value = 'Enter your email, phone number or username.')
  }

  // Registered shop, first sign-in: check the code, then on to choosing a username + password
  if (who.value.status === 'setup') {
    if (code.value.length !== 6) {
      fieldErr.value = 'code'
      return (error.value = 'Enter the 6-digit code from your email.')
    }
    loading.value = true
    loadingText.value = 'Checking your code'
    try {
      await auth.setupVerify(identifier.value, code.value)
      router.push({ name: 'setup' })
    } catch (e) {
      error.value = e.message
      fieldErr.value = 'code'
      code.value = ''
    } finally {
      loading.value = false
    }
    return
  }

  if (who.value.status === 'unknown' || who.value.status === 'suspended') {
    fieldErr.value = 'identifier'
    return (error.value = whoLine.value)
  }
  if (password.value.length < 6) {
    fieldErr.value = 'password'
    return (error.value = 'Password must be at least 6 characters.')
  }

  loading.value = true
  loadingText.value = 'Signing you in'
  try {
    const res = await auth.continue({ identifier: identifier.value, password: password.value })
    if (res.next === 'verify') {
      loadingText.value = 'Sending your code'
      const redirect = safeRedirect(route.query.redirect)
      router.push({ name: 'verify', query: redirect ? { redirect } : {} })
      return
    }
    toast(`Welcome back, ${(auth.user?.name || 'there').split(' ')[0]}!`)
    router.replace(safeRedirect(route.query.redirect) || auth.homeRoute)
  } catch (e) {
    error.value = e.message
    // a registered shop tried a password before setting one up: switch to the code step
    if (e.data?.setup || e.setup) {
      checkedFor = ''
      check(identifier.value)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(380px, 1fr) minmax(0, 1.05fr);
  background: var(--bg);
}

/* ---------- brand side ---------- */
.auth-brand {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  padding: clamp(28px, 5vh, 44px) clamp(28px, 4vw, 56px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  color: #fff;
  background-color: #052e1c;
  background-size: cover;
  background-position: center;
  transition: background-image 0.6s ease;
}
.brand-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(5, 46, 28, 0.55) 0%, rgba(5, 46, 28, 0.82) 55%, rgba(3, 30, 18, 0.96) 100%),
    radial-gradient(600px 400px at 100% 0%, rgba(134, 239, 172, 0.28), transparent 60%);
}
.brand-top,
.brand-copy,
.brand-foot {
  position: relative;
  z-index: 1;
}
.brand-copy {
  max-width: 480px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(6px);
  margin-bottom: 20px;
}
.eyebrow .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.25);
}
.brand-copy h2 {
  font-size: clamp(30px, 3.2vw, 44px);
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -0.035em;
  margin: 0 0 16px;
  text-wrap: balance;
}
.brand-copy p {
  color: rgba(236, 253, 245, 0.85);
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
}
.features {
  list-style: none;
  padding: 0;
  margin: 32px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.features li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
}
.features b {
  display: block;
  font-size: 14.5px;
  font-weight: 700;
}
.features small {
  display: block;
  color: rgba(236, 253, 245, 0.7);
  font-size: 13px;
}
.f-ico {
  flex: none;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(74, 222, 128, 0.18);
  color: #86efac;
}
.brand-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: rgba(236, 253, 245, 0.65);
}
.brand-foot nav {
  display: flex;
  gap: 18px;
}
.brand-foot a {
  color: inherit;
}
.brand-foot a:hover {
  color: #fff;
}

/* ---------- form side ---------- */
.auth-main {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px var(--gutter) 28px;
  min-height: 100vh;
  min-height: 100dvh;
}
.main-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  transition: color 0.15s;
}
.back:hover {
  color: var(--text);
}
.mobile-logo {
  display: none;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  margin: auto 0;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
/* a plain stacked heading (overrides the dashboard .card-head row style in main.css) */
.auth-card .card-head {
  display: block;
  padding: 0;
  border: 0;
  background: none;
}
.card-head h1 {
  font-size: clamp(26px, 3vw, 32px);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 6px;
}
.sub {
  color: var(--muted);
  margin: 0;
}

/* ---------- Sign in / Sign up switch ---------- */
.modes {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 5px;
  border-radius: 16px;
  background: var(--surface-3);
  border: 1px solid var(--border);
}
.mode-thumb {
  position: absolute;
  top: 5px;
  bottom: 5px;
  left: 5px;
  width: calc(50% - 5px);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 6px 16px -6px rgba(22, 163, 74, 0.45), inset 0 -3px 0 var(--brand);
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
}
.mode-thumb.right {
  transform: translateX(100%);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 6px 16px -6px rgba(249, 115, 22, 0.45), inset 0 -3px 0 var(--orange);
}
.modes button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  border: 0;
  border-radius: 12px;
  background: none;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.25s;
}
.modes button:hover {
  color: var(--text);
}
.modes button.on {
  color: var(--text);
}
.modes button.on .icon {
  color: var(--brand);
  animation: tab-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modes button.on:last-of-type .icon {
  color: var(--orange);
}
.modes button:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
@keyframes tab-pop {
  40% {
    transform: scale(1.35) rotate(-8deg);
  }
}
.setup-badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  background: var(--black, #0c0f0d);
  box-shadow: inset 0 -2px 0 var(--orange);
}

/* the form explains when it switched tabs by itself */
.switch-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: -6px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--accent-700);
  background: var(--accent-50);
  border: 1px solid var(--accent-100);
}
.switch-note .icon {
  flex: none;
  margin-top: 1px;
}

/* "New to Fastop? Create an account" */
.alt {
  margin: -4px 0 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}
.alt .link-btn {
  font-size: 14px;
  position: relative;
}
.alt .link-btn::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  border-radius: 2px;
  background: var(--orange);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
}
.alt .link-btn:hover::after {
  transform: scaleX(1);
}

/* button: label swaps smoothly, a soft sheen passes now and then */
.submit {
  position: relative;
  overflow: hidden;
}
.btn-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.submit::after {
  content: '';
  position: absolute;
  top: 0;
  left: -60%;
  width: 40%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: skewX(-20deg);
  animation: sheen 4s ease-in-out 1.2s infinite;
  pointer-events: none;
}
@keyframes sheen {
  0%,
  65% {
    left: -60%;
  }
  100% {
    left: 130%;
  }
}

/* words that change (heading, labels, button) rise in with a soft blur */
.word-enter-active,
.word-leave-active {
  transition: opacity 0.22s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.22s ease;
}
.word-enter-from {
  opacity: 0;
  transform: translateY(8px);
  filter: blur(4px);
}
.word-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  filter: blur(4px);
}
.note-enter-active,
.note-leave-active {
  transition: opacity 0.3s, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), max-height 0.3s;
  max-height: 80px;
  overflow: hidden;
}
.note-enter-from,
.note-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
  max-height: 0;
}

/* the form's parts arrive one after another when the page opens */
.auth-card > [style*='--i'] {
  animation: card-in 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: calc(var(--i) * 70ms + 120ms);
}
@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .mode-thumb,
  .word-enter-active,
  .word-leave-active,
  .note-enter-active,
  .note-leave-active {
    transition: none;
  }
  .auth-card > [style*='--i'],
  .submit::after,
  .modes button.on .icon {
    animation: none;
  }
}

/* segmented account type */
.segmented {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  border-radius: 12px;
  background: var(--surface-2, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--border);
  margin-top: 6px;
}
.seg-thumb {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border-radius: 9px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s cubic-bezier(0.3, 0.7, 0.2, 1);
}
.seg-thumb.right {
  transform: translateX(100%);
}
.segmented button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border: 0;
  background: none;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  border-radius: 9px;
  cursor: pointer;
  transition: color 0.15s;
}
.segmented button.on {
  color: var(--text);
}
.segmented button.on .icon {
  color: var(--brand);
}
.segmented button:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.seg-note {
  margin: -10px 0 0;
  font-size: 12.5px;
  color: var(--muted);
}

/* fields */
.field label {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  margin-bottom: 7px;
}
.control {
  position: relative;
  display: flex;
  align-items: center;
  height: 50px;
  border-radius: 12px;
  border: 1px solid var(--border-strong, var(--border));
  background: var(--surface);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.control:hover {
  border-color: var(--muted);
}
.control:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 4px var(--brand-100);
}
.control.invalid {
  border-color: var(--danger, #dc2626);
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.12);
}
.lead-ico {
  position: absolute;
  left: 15px;
  color: var(--muted);
  pointer-events: none;
}
.control:focus-within .lead-ico {
  color: var(--brand);
}
.control input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 14px 0 44px;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 15px;
  color: var(--text);
  border-radius: 12px;
}
.control input::placeholder {
  color: var(--muted);
  opacity: 0.7;
}
.eye {
  flex: none;
  width: 38px;
  height: 38px;
  margin-right: 6px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: none;
  color: var(--muted);
  cursor: pointer;
}
.eye:hover {
  color: var(--text);
  background: var(--surface-2, rgba(0, 0, 0, 0.05));
}
.hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 7px 0 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--warning, #b45309);
}

/* recognition: spinner / tick inside the box, then a line saying who this is */
.trail {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  margin-right: 6px;
  color: var(--muted);
}
.trail.ok {
  color: var(--success);
}
.who {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}
.who .icon {
  margin-top: 2px;
}
.who.good {
  color: var(--success);
}
.who.bad {
  color: var(--danger);
}
.code-control input {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.5em;
  font-variant-numeric: tabular-nums;
}
.muted-hint {
  color: var(--muted);
  font-weight: 500;
  flex-wrap: wrap;
}
.link-btn {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 700;
  color: var(--brand);
  cursor: pointer;
}
.link-btn:disabled {
  color: var(--muted);
  cursor: default;
}
.main-top.in-app {
  justify-content: center;
}

.submit {
  height: 52px;
  margin-top: 4px;
  font-size: 15.5px;
}

.main-foot {
  margin: 0;
  font-size: 14px;
}
.main-foot a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 999px;
  color: var(--muted);
  font-weight: 600;
  transition: color 0.15s, background 0.15s;
}
.main-foot a:hover,
.main-foot a:focus-visible {
  color: var(--brand);
  background: var(--brand-100);
}

/* transitions */
.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ---------- responsive ---------- */
@media (max-width: 960px) {
  .auth {
    grid-template-columns: 1fr;
  }
  .auth-brand {
    display: none;
  }
  /* phones and tablets: logo on the left, no extra words, the form is the page */
  .auth-main {
    padding: 18px var(--gutter) 22px;
    background: radial-gradient(520px 300px at 0% 0%, var(--brand-100), transparent 70%), var(--bg);
  }
  /* logo on the left; on the website (not the installed app) a "Home" pill on the right */
  .main-top,
  .main-top.in-app {
    justify-content: space-between;
    gap: 12px;
  }
  .back {
    order: 2;
    height: 40px;
    padding: 0 16px 0 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: border-color 0.15s, color 0.15s, transform 0.1s;
  }
  .back:hover,
  .back:focus-visible {
    border-color: var(--brand);
    color: var(--brand);
  }
  .back:active {
    transform: scale(0.96);
  }
  .mobile-logo {
    display: inline-flex;
  }
  .auth-card {
    padding: 36px 0 24px;
    gap: 16px;
  }
  .card-head {
    margin-bottom: 6px;
  }
  .card-head h1 {
    font-size: 30px;
  }
}
@media (max-width: 480px) {
  .auth-card {
    margin: 12vh 0 auto;
    padding-top: 0;
  }
  .control {
    height: 52px;
  }
  .control input {
    font-size: 16px; /* 16px stops iPhones zooming into the field */
  }
}
@media (prefers-reduced-motion: reduce) {
  .seg-thumb,
  .swap-enter-active,
  .swap-leave-active {
    transition: none;
  }
}
</style>
