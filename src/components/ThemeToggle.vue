<template>
  <button class="theme-toggle" :class="theme" @click="toggle" :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
    <span class="knob">
      <AppIcon :name="theme === 'dark' ? 'moon' : 'sun'" :size="14" :stroke="2.4" />
    </span>
  </button>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
import { useTheme } from '@/composables/useTheme'
const { theme, toggle } = useTheme()
</script>

<style scoped>
.theme-toggle {
  position: relative;
  width: 52px;
  height: 28px;
  flex: none;
  border-radius: 99px;
  border: 1px solid var(--border);
  background: linear-gradient(90deg, #86efac, #ffffff);
  padding: 0;
  transition: background 0.3s, border-color 0.3s;
}
.theme-toggle.dark {
  background: linear-gradient(90deg, #052e16, #14532d);
  border-color: #1f5134;
}
.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff;
  color: #d97706;
  box-shadow: 0 2px 6px rgba(11, 31, 20, 0.25);
  transition: left 0.3s cubic-bezier(0.4, 1.4, 0.6, 1), background 0.3s, color 0.3s;
}
.dark .knob {
  left: 26px;
  background: #07110b;
  color: #86efac;
}
</style>
