<template>
  <Transition name="drop">
    <div v-if="visible && !onAuthScreen" class="install" role="dialog" aria-live="polite" aria-label="Install Fastop">
      <img src="/icons/icon-192.png" alt="" class="ico" />
      <div class="txt" :class="{ steps: showSteps }">
        <b>Get the Fastop app</b>
        <span v-if="showSteps">{{ manualSteps }}</span>
        <span v-else>Free. Installs in one tap, opens straight away, works on a weak connection.</span>
      </div>
      <div class="act">
        <button v-if="!showSteps" class="btn btn-primary btn-sm" @click="onInstall">
          <AppIcon name="arrowRight" :size="15" style="transform: rotate(90deg)" /> Install
        </button>
        <button class="btn-icon sm close" aria-label="Not now" @click="dismiss"><AppIcon name="x" :size="18" /></button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { usePwa } from '@/composables/usePwa'
import { toast } from '@/stores/toast'

// Every time the site is opened (and the app isn't installed yet) the banner slides in,
// stays for 2 minutes, then leaves for the rest of that visit. ✕ closes it for the visit too.
const FIRST_SHOW_MS = 1500
const SHOW_FOR_MS = 2 * 60 * 1000

const { isInstalled, manualSteps, install } = usePwa()
const visible = ref(false)
// Keep sign-in and code-entry screens clear; the reminder resumes on any other page.
const route = useRoute()
const onAuthScreen = computed(() => ['auth', 'verify'].includes(route.name))
const showSteps = ref(false)
let timer = null

function show() {
  if (isInstalled.value) return
  visible.value = true
  timer = setTimeout(dismiss, SHOW_FOR_MS)
}

function dismiss() {
  clearTimeout(timer)
  visible.value = false
  showSteps.value = false
}

// One tap: Chromium browsers (Android, Windows, Mac) open their install dialog straight away.
// Browsers that don't allow that (iPhone/iPad Safari, Firefox) get their exact steps instead.
async function onInstall() {
  const outcome = await install()
  if (outcome === 'manual') {
    showSteps.value = true
  } else if (outcome === 'accepted') {
    visible.value = false
    toast('Fastop is installed. You\'ll find it with your other apps.')
  } else {
    dismiss()
  }
}

watch(isInstalled, (on) => {
  if (on) {
    visible.value = false
    clearTimeout(timer)
  }
})

onMounted(() => {
  if (!isInstalled.value) timer = setTimeout(show, FIRST_SHOW_MS)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<style scoped>
.install {
  position: fixed;
  /* sits just under the sticky headers (72px public, 64-68px app) so it never hides the logo or nav */
  top: calc(env(safe-area-inset-top, 0px) + 84px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: min(560px, calc(100% - 24px));
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 12px 12px 14px;
  border-radius: 18px;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
}
.ico {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex: none;
  border: 1px solid var(--border);
}
.txt {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
}
.txt b {
  font-size: 15px;
  color: var(--text);
}
.act {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}
.close {
  color: var(--muted);
}
.drop-enter-active {
  transition: transform 0.45s cubic-bezier(0.2, 1.2, 0.4, 1), opacity 0.3s;
}
.drop-leave-active {
  transition: transform 0.25s ease-in, opacity 0.25s;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translate(-50%, -60px);
}
/* phones: a slim one-line bar so it doesn't hide the page headline */
@media (max-width: 600px) {
  .install {
    top: calc(env(safe-area-inset-top, 0px) + 78px);
    gap: 10px;
    padding: 8px 8px 8px 10px;
    border-radius: 14px;
  }
  .ico {
    width: 34px;
    height: 34px;
    border-radius: 9px;
  }
  .txt b {
    font-size: 14px;
  }
  .txt span {
    display: none;
  }
  .txt.steps span {
    display: block;
    font-size: 12px;
  }
}
</style>
