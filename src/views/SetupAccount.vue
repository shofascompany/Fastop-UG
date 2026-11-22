<template>
  <div class="setup">
    <form class="card setup-card" @submit.prevent="submit" novalidate>
      <AppLogo :size="40" />
      <div class="steps" aria-hidden="true">
        <span class="done"><AppIcon name="check" :size="13" /></span><i></i><span class="now">2</span><i></i><span>3</span>
      </div>

      <header>
        <h1>Welcome{{ firstName ? `, ${firstName}` : '' }}</h1>
        <p class="muted">
          <b>{{ info?.shopName || 'Your shop' }}</b> is ready on Fastop. Choose the username and password you'll use to sign in from now on.
        </p>
      </header>

      <div class="field">
        <label for="username">Username</label>
        <div class="control" :class="{ invalid: fieldErr === 'username' }">
          <AppIcon name="user" :size="18" class="lead-ico" />
          <input
            id="username"
            ref="userEl"
            v-model.trim="username"
            autocomplete="username"
            autocapitalize="off"
            spellcheck="false"
            placeholder="e.g. mamarose"
            maxlength="30"
            @input="clearErr"
          />
        </div>
        <p class="hint">Letters, numbers, dots or underscores. You can also still sign in with {{ info?.email || 'your email' }}.</p>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <div class="control" :class="{ invalid: fieldErr === 'password' }">
          <AppIcon name="lock" :size="18" class="lead-ico" />
          <input id="password" v-model="password" :type="show ? 'text' : 'password'" autocomplete="new-password" placeholder="At least 8 characters" @input="clearErr" />
          <button type="button" class="eye" @click="show = !show" :aria-label="show ? 'Hide password' : 'Show password'">
            <AppIcon :name="show ? 'eyeOff' : 'eye'" :size="18" />
          </button>
        </div>
        <div class="meter" :data-level="strength.level" aria-hidden="true"><i></i><i></i><i></i></div>
        <p class="hint">{{ strength.text }}</p>
      </div>

      <div class="field">
        <label for="confirm">Confirm password</label>
        <div class="control" :class="{ invalid: fieldErr === 'confirm' }">
          <AppIcon name="lock" :size="18" class="lead-ico" />
          <input id="confirm" v-model="confirm" :type="show ? 'text' : 'password'" autocomplete="new-password" placeholder="Type it again" @input="clearErr" />
        </div>
      </div>

      <div v-if="error" class="alert danger" role="alert"><AppIcon name="alert" :size="18" /> {{ error }}</div>

      <button class="btn btn-primary btn-lg btn-block" :disabled="loading">
        <template v-if="loading"><AppLoader variant="inline" /> Saving</template>
        <template v-else>Save and continue <AppIcon name="arrowRight" :size="18" /></template>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'
import AppIcon from '@/components/AppIcon.vue'
import AppLoader from '@/components/AppLoader.vue'
import { useAuth } from '@/stores/auth'
import { toast } from '@/stores/toast'

const auth = useAuth()
const router = useRouter()
const info = computed(() => auth.setup)
const firstName = computed(() => (info.value?.name || '').split(' ')[0])

const username = ref(info.value?.suggestedUsername || '')
const password = ref('')
const confirm = ref('')
const show = ref(false)
const error = ref('')
const fieldErr = ref('')
const loading = ref(false)
const userEl = ref(null)

onMounted(() => userEl.value?.focus())

const strength = computed(() => {
  const p = password.value
  if (!p) return { level: 0, text: 'Use at least 8 characters. Mixing words and numbers makes it stronger.' }
  if (p.length < 8) return { level: 1, text: `${8 - p.length} more ${8 - p.length === 1 ? 'character' : 'characters'} to go.` }
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^a-z0-9]/i].filter((r) => r.test(p)).length
  return p.length >= 12 && variety >= 3 ? { level: 3, text: 'Strong password.' } : { level: 2, text: 'Good. A longer one is even safer.' }
})

function clearErr() {
  error.value = ''
  fieldErr.value = ''
}

async function submit() {
  clearErr()
  if (!/^[a-z0-9][a-z0-9._]{2,29}$/i.test(username.value)) {
    fieldErr.value = 'username'
    return (error.value = 'Usernames are 3–30 letters, numbers, dots or underscores.')
  }
  if (password.value.length < 8) {
    fieldErr.value = 'password'
    return (error.value = 'Choose a password of at least 8 characters.')
  }
  if (password.value !== confirm.value) {
    fieldErr.value = 'confirm'
    return (error.value = "The passwords don't match.")
  }
  loading.value = true
  try {
    await auth.setupComplete({ username: username.value, password: password.value })
    toast('Your login is ready')
    router.replace({ name: 'welcome' })
  } catch (e) {
    error.value = e.message
    if (/username/i.test(e.message)) fieldErr.value = 'username'
    if (e.status === 401) setTimeout(() => router.replace({ name: 'auth' }), 1800) // setup ticket expired
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.setup {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px var(--gutter, 16px);
  background: radial-gradient(700px 400px at 100% 0%, var(--hero-glow-1, transparent), transparent 70%), var(--bg);
}
.setup-card {
  width: 100%;
  max-width: 460px;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border-radius: 22px;
  box-shadow: var(--shadow-lg);
}
.steps {
  display: flex;
  align-items: center;
  gap: 8px;
}
.steps span {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  background: var(--surface-3);
  color: var(--muted);
}
.steps span.done {
  background: var(--success);
  color: #fff;
}
.steps span.now {
  background: var(--brand);
  color: #fff;
  box-shadow: 0 0 0 4px var(--brand-100);
}
.steps i {
  flex: 1;
  height: 2px;
  background: var(--border);
  border-radius: 2px;
}
h1 {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 6px;
}
header p {
  margin: 0;
  line-height: 1.55;
}
header b {
  color: var(--text);
}
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
.control:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 4px var(--brand-100);
}
.control.invalid {
  border-color: var(--danger);
  box-shadow: 0 0 0 4px var(--danger-50);
}
.lead-ico {
  position: absolute;
  left: 15px;
  color: var(--muted);
  pointer-events: none;
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
.hint {
  margin: 7px 0 0;
  font-size: 12.5px;
  color: var(--muted);
}
.meter {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-top: 9px;
}
.meter i {
  height: 4px;
  border-radius: 4px;
  background: var(--border);
  transition: background 0.25s;
}
.meter[data-level='1'] i:nth-child(1) {
  background: var(--danger);
}
.meter[data-level='2'] i:nth-child(-n + 2) {
  background: var(--warning);
}
.meter[data-level='3'] i {
  background: var(--success);
}
</style>
