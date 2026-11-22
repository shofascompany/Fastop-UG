<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="overlay" @mousedown.self="$emit('close')">
        <div class="modal" :style="{ maxWidth: width }" role="dialog" aria-modal="true">
          <header class="modal-head">
            <h3>{{ title }}</h3>
            <button class="btn-icon sm" @click="$emit('close')" aria-label="Close"><AppIcon name="x" :size="18" /></button>
          </header>
          <div class="modal-body"><slot /></div>
          <footer v-if="$slots.footer" class="modal-foot"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  open: Boolean,
  title: { type: String, default: '' },
  width: { type: String, default: '560px' },
})
const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
watch(
  () => props.open,
  (v) => {
    if (v) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
  },
)
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 1500;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
}
.modal {
  width: 100%;
  background: var(--surface);
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}
.modal-head h3 {
  font-size: 18px;
}
.modal-body {
  padding: 22px;
  overflow-y: auto;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid var(--border);
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.2s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal {
  transform: translateY(12px) scale(0.98);
}
</style>
