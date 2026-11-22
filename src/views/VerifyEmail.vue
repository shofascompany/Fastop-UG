<template>
  <div class="verify">
    <RouterLink to="/" class="logo"><AppLogo :size="40" /></RouterLink>

    <form class="card vcard" @submit.prevent="submit" novalidate>
      <div class="mail-ico"><AppIcon name="mail" :size="28" /></div>
      <h1>Check your email</h1>
      <p class="sub">
        We sent a 6-digit code to <b>{{ auth.pendingEmail }}</b>.<br />
        Enter it below to confirm it's you.
      </p>

      <div class="boxes" :class="{ shake }" @paste.prevent="onPaste">
        <input
          v-for="(d, i) in digits"
          :key="i"
          :ref="(el) => (inputs[i] = el)"
          v-model="digits[i]"
          class="box"
          :class="{ filled: digits[i] }"
          type="text"
          inputmode="numeric"
          :autocomplete="i === 0 ? 'one-time-code' : 'off'"
          maxlength="1"
          :aria-label="`Digit ${i + 1}`"
          :disabled="loading || expired"
          @input="onInput(i, $event)"
          @keydown.backspace="onBack(i, $event)"
          @keydown.left.prevent="focus(i - 1)"
          @keydown.right.prevent="focus(i + 1)"
        />
      </div>

      <div v-if="error" class="alert danger"><AppIcon name="alert" :size="18" /> {{ error }}</div>
      <div v-else-if="notice" class="alert success"><AppIcon name="check" :size="18" /> {{ notice }}</div>

      <button class="btn btn-primary btn-lg btn-block" :disabled="loading || code.length !== 6 || expired">
        <template v-if="loading"><AppLoader variant="inline" /> Checking</template>
        <template v-else>Confirm email <AppIcon name="check" :size="18" /></template>
      </button>

      <p class="timer" :class="{ late: remaining < 120 }">
        <AppIcon name="clock" :size="15" />
        <span v-if="!expired">Code expires in <b>{{ mmss(remaining) }}</b></span>
        <span v-else>This code has expired. Send a new one.</span>
      </p>

      <div class="links">
        <button type="button" class="link" :disabled="cooldown > 0 || sending" @click="resend">
          <AppIcon name="refresh" :size="15" />
          {{ sending ? 'Sending…' : cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code' }}
        </button>
        <button type="button" class="link muted-link" @click="changeEmail"><AppIcon name="arrowLeft" :size="15" /> Use a different email</button>
      </div>

      <p class="hint-line">Can't find it? Check your Spam or Promotions folder.</p>
    </form>

    <AppLoader v-if="loading" variant="overlay" text="Confirming your email" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'
import AppIcon from '@/components/AppIcon.vue'
import AppLoader from '@/components/AppLoader.vue'
import { useAuth } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { safeRedirect } from '@/router'

const CODE_MINUTES = 15
const RESEND_SECONDS = 60

const auth = useAuth()
const route = useRoute()
const router = useRouter()

const digits = reactive(['', '', '', '', '', ''])
const inputs = []
const code = computed(() => digits.join(''))
const loading = ref(false)
const sending = ref(false)
const error = ref('')
const notice = ref('')
const shake = ref(false)

// countdowns
const expiresAt = ref(Date.now() + CODE_MINUTES * 60_000)
const now = ref(Date.now())
const cooldownUntil = ref(Date.now() + RESEND_SECONDS * 1000)
const remaining = computed(() => Math.max(0, Math.round((expiresAt.value - now.value) / 1000)))
const cooldown = computed(() => Math.max(0, Math.ceil((cooldownUntil.value - now.value) / 1000)))
const expired = computed(() => remaining.value === 0)
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
let tick = null

onMounted(() => {
  tick = setInterval(() => (now.value = Date.now()), 1000)
  nextTick(() => focus(0))
})
onBeforeUnmount(() => clearInterval(tick))

function focus(i) {
  if (i >= 0 && i < 6) inputs[i]?.focus()
}
function fill(str) {
  const nums = str.replace(/\D/g, '').slice(0, 6).split('')
  nums.forEach((n, k) => (digits[k] = n))
  focus(Math.min(nums.length, 5))
  if (nums.length === 6) submit()
}
function onInput(i, e) {
  const v = e.target.value.replace(/\D/g, '')
  if (v.length > 1) return fill(v) // autofill / paste into one box
  digits[i] = v
  error.value = ''
  if (v) focus(i + 1)
  if (code.value.length === 6) submit()
}
function onBack(i, e) {
  if (!digits[i] && i > 0) {
    e.preventDefault()
    digits[i - 1] = ''
    focus(i - 1)
  }
}
function onPaste(e) {
  fill(e.clipboardData?.getData('text') || '')
}
function clear() {
  digits.forEach((_, k) => (digits[k] = ''))
  focus(0)
}

async function submit() {
  if (loading.value || code.value.length !== 6) return
  error.value = ''
  notice.value = ''
  loading.value = true
  try {
    await auth.verify(code.value)
    toast('Email confirmed. Welcome to Fastop!')
    router.replace(safeRedirect(route.query.redirect) || auth.homeRoute)
  } catch (e) {
    error.value = e.message
    if (e.data?.expired) expiresAt.value = Date.now()
    shake.value = true
    setTimeout(() => (shake.value = false), 500)
    loading.value = false
    digits.forEach((_, k) => (digits[k] = ''))
    await nextTick() // inputs are enabled again before focusing the first box
    focus(0)
  } finally {
    loading.value = false
  }
}

async function resend() {
  error.value = ''
  notice.value = ''
  sending.value = true
  try {
    await auth.resend()
    notice.value = `A new code is on its way to ${auth.pendingEmail}.`
    expiresAt.value = Date.now() + CODE_MINUTES * 60_000
    cooldownUntil.value = Date.now() + RESEND_SECONDS * 1000
    clear()
  } catch (e) {
    error.value = e.message
    if (e.data?.retryIn) cooldownUntil.value = Date.now() + e.data.retryIn * 1000
  } finally {
    sending.value = false
  }
}

function changeEmail() {
  auth.cancelPending()
  router.replace({ name: 'auth' })
}
</script>

<style scoped>
.verify {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 32px var(--gutter);
  background: radial-gradient(600px 360px at 50% 0%, var(--hero-glow-1), transparent 70%), var(--bg);
}
.vcard {
  width: 100%;
  max-width: 440px;
  padding: clamp(22px, 5vw, 34px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  border-radius: 22px;
  box-shadow: var(--shadow);
}
.mail-ico {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  background: var(--grad-brand-strong);
  color: var(--on-brand);
  animation: pop 0.5s cubic-bezier(0.3, 1.5, 0.5, 1) both;
}
h1 {
  font-size: clamp(22px, 4vw, 28px);
  font-weight: 800;
  letter-spacing: -0.03em;
}
.sub {
  color: var(--muted);
  margin-top: -6px;
  word-break: break-word;
}
.sub b {
  color: var(--text);
}
.boxes {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(6px, 2vw, 10px);
  width: 100%;
  margin: 4px 0;
}
.box {
  width: 100%;
  aspect-ratio: 0.85;
  max-height: 64px;
  text-align: center;
  font-size: clamp(22px, 6vw, 28px);
  font-weight: 800;
  border-radius: 12px;
  border: 2px solid var(--border);
  background: var(--surface);
  color: var(--text);
  outline: none;
  caret-color: var(--brand);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.box:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 4px var(--brand-100);
}
.box.filled {
  border-color: var(--brand);
  background: var(--brand-50);
  transform: translateY(-1px);
}
.shake {
  animation: shake 0.4s;
}
.alert {
  width: 100%;
  text-align: left;
}
.timer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--muted);
}
.timer.late {
  color: var(--warning);
}
.links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
}
.link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: none;
  font-weight: 700;
  font-size: 14px;
  color: var(--brand);
}
.link:disabled {
  color: var(--muted);
  cursor: default;
}
.muted-link {
  color: var(--text-2);
}
.hint-line {
  font-size: 12.5px;
  color: var(--muted);
}
@keyframes shake {
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}
@keyframes pop {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
}
</style>
