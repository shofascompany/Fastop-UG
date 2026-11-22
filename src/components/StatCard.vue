<template>
  <div class="stat card" :class="`tone-${toneName}`">
    <div class="stat-icon" :style="customStyle"><AppIcon :name="icon" :size="20" /></div>
    <div class="stat-meta">
      <span class="stat-label">{{ label }}</span>
      <strong class="stat-value">{{ value }}</strong>
      <span v-if="hint" class="stat-hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  icon: { type: String, default: 'chart' },
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  /** brand | accent | success | info | warning | danger (or any hex colour) */
  tone: { type: String, default: 'brand' },
})

const NAMED = ['brand', 'accent', 'success', 'info', 'warning', 'danger']
const toneName = computed(() => (NAMED.includes(props.tone) ? props.tone : 'custom'))
const customStyle = computed(() =>
  toneName.value === 'custom' ? { background: `linear-gradient(135deg, ${props.tone}55, ${props.tone}0d)`, color: props.tone } : null,
)
</script>

<style scoped>
.stat {
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 14px;
  padding: 18px;
  align-items: flex-start;
}
/* a soft wash of the tone's gradient in the corner */
.stat::after {
  content: '';
  position: absolute;
  inset: 0 0 auto auto;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  transform: translate(40%, -40%);
  background: var(--wash, transparent);
  opacity: 0.55;
  pointer-events: none;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex: none;
  box-shadow: inset 0 0 0 1px rgba(11, 31, 20, 0.06);
}
.tone-brand .stat-icon { background: var(--grad-brand-strong); color: var(--on-brand); }
.tone-accent .stat-icon { background: var(--grad-accent-soft); color: var(--accent-700); }
.tone-success .stat-icon { background: var(--grad-success); color: var(--success-ink); }
.tone-info .stat-icon { background: var(--grad-info); color: var(--info-ink); }
.tone-warning .stat-icon { background: var(--grad-warning); color: var(--warning-ink); }
.tone-danger .stat-icon { background: var(--grad-danger); color: var(--danger-ink); }
.tone-brand { --wash: var(--grad-brand); }
.tone-accent { --wash: var(--grad-accent-soft); }
.tone-success { --wash: var(--grad-success); }
.tone-info { --wash: var(--grad-info); }
.tone-warning { --wash: var(--grad-warning); }
.tone-danger { --wash: var(--grad-danger); }
.stat-meta {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.stat-label {
  font-size: 13px;
  color: var(--muted);
  font-weight: 600;
}
.stat-value {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.stat-hint {
  font-size: 12px;
  color: var(--muted);
}
</style>
