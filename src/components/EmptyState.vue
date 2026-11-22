<template>
  <div class="empty">
    <div class="empty-icon"><AppIcon :name="icon" :size="26" /></div>
    <h3>{{ title }}</h3>
    <p v-if="text">{{ text }}</p>
    <div v-if="$slots.default" class="empty-actions"><slot /></div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
defineProps({
  icon: { type: String, default: 'box' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
})
</script>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 20px;
  gap: 8px;
}
.empty-icon {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: var(--brand-50);
  color: var(--brand);
  margin-bottom: 6px;
}
h3 {
  font-size: 17px;
}
p {
  color: var(--muted);
  max-width: 380px;
}
.empty-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
</style>
