<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        <AppIcon :name="t.type === 'error' ? 'alert' : t.type === 'info' ? 'info' : 'check'" :size="18" />
        <span>{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
import { toasts } from '@/stores/toast'
</script>

<style scoped>
.toasts {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: calc(100% - 40px);
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--toast-bg);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
}
.toast.success .icon {
  color: #4ade80;
}
.toast.error .icon {
  color: #f87171;
}
.toast.info .icon {
  color: #60a5fa;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
@media (max-width: 720px) {
  .toasts {
    bottom: 84px;
    right: 16px;
    left: 16px;
  }
}
</style>
