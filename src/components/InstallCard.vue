<template>
  <section v-if="!isInstalled" class="get-app" :class="{ compact, feature }">
    <img src="/icons/icon-192.png" alt="" class="app-ico" />
    <div class="ga-txt">
      <span v-if="feature" class="ga-kicker">Free app</span>
      <b>{{ feature ? 'Fastop, right on your home screen' : 'Get the Fastop app' }}</b>
      <span v-if="showSteps">{{ manualSteps }}</span>
      <span v-else-if="feature">Install in one tap. No app store, no waiting, and it's ready whenever you are.</span>
      <span v-else>Free on any phone, tablet or computer. One tap to install, no app store needed.</span>
      <ul v-if="feature && !showSteps" class="ga-perks">
        <li><AppIcon name="bolt" :size="15" /> Opens in a flash</li>
        <li><AppIcon name="layers" :size="15" /> Works on a weak signal</li>
        <li><AppIcon name="heart" :size="15" /> Saved items always at hand</li>
      </ul>
    </div>
    <button v-if="!showSteps" class="btn" :class="feature ? 'btn-light btn-lg' : 'btn-primary'" @click="onInstall">
      <AppIcon name="arrowRight" :size="16" style="transform: rotate(90deg)" /> Install app
    </button>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { usePwa } from '@/composables/usePwa'
import { toast } from '@/stores/toast'

defineProps({
  compact: { type: Boolean, default: false }, // small, light: app page footers
  feature: { type: Boolean, default: false }, // large, deep green: its own landing section
})

const { isInstalled, manualSteps, install } = usePwa()
const showSteps = ref(false)

async function onInstall() {
  const outcome = await install()
  if (outcome === 'manual') showSteps.value = true
  else if (outcome === 'accepted') toast('Fastop is installed. You\'ll find it with your other apps.')
}
</script>

<style scoped>
.get-app {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
}
.app-ico {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  flex: none;
  background: #fff;
}
.ga-txt {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  color: #c9dfd0;
}
.ga-txt b {
  font-size: 17px;
  color: #fff;
}
/* light version for pages with a light footer */
.compact {
  padding: 14px 16px;
  background: var(--surface-2);
  border-color: var(--border);
  color: var(--text);
}
.compact .ga-txt {
  color: var(--muted);
}
.compact .ga-txt b {
  color: var(--text);
  font-size: 15px;
}
.compact .app-ico {
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
}
/* landing section: deep green panel with white text, readable in both themes */
.feature {
  position: relative;
  overflow: hidden;
  gap: 28px;
  padding: 40px 44px;
  border-radius: 28px;
  border: none;
  background: var(--grad-hero);
  box-shadow: var(--shadow-lg);
}
.feature::after {
  content: '';
  position: absolute;
  right: -80px;
  top: -80px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(134, 239, 172, 0.35), transparent 70%);
  pointer-events: none;
}
.feature .app-ico {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  animation: float 4s ease-in-out infinite;
}
.feature .ga-txt {
  font-size: 16px;
  color: #d8eedf;
  gap: 6px;
}
.feature .ga-txt b {
  font-size: clamp(24px, 3vw, 34px);
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.ga-kicker {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #86efac;
}
.ga-perks {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}
.ga-perks li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ga-perks .icon {
  color: #86efac;
}
.btn-light {
  position: relative;
  z-index: 1;
  background: #fff;
  color: #14532d;
  font-weight: 800;
}
.btn-light:hover {
  background: #f0fdf4;
}
@keyframes float {
  50% {
    transform: translateY(-8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .feature .app-ico {
    animation: none;
  }
}
@media (max-width: 760px) {
  .feature {
    padding: 28px 22px;
    gap: 18px;
  }
  .feature .app-ico {
    width: 72px;
    height: 72px;
    border-radius: 18px;
  }
}
@media (max-width: 560px) {
  .get-app {
    flex-wrap: wrap;
  }
  .get-app .btn {
    width: 100%;
  }
}
</style>
