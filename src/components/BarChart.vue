<template>
  <div class="bars" :style="{ height: height + 'px' }">
    <div v-for="(d, i) in data" :key="i" class="bar-col" :title="`${d.label}: ${format(d.value)}`">
      <span class="bar-val">{{ d.value ? shortFormat(d.value) : '' }}</span>
      <div class="bar-track">
        <div class="bar" :style="{ height: pct(d.value) + '%', background: i === data.length - 1 ? highlight : color }"></div>
      </div>
      <span class="bar-label">{{ d.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { compact } from '@/utils/format'

const props = defineProps({
  data: { type: Array, default: () => [] },
  height: { type: Number, default: 220 },
  color: { type: String, default: 'linear-gradient(180deg, var(--brand-200), var(--brand-100))' },
  highlight: { type: String, default: 'var(--grad-bar)' },
  format: { type: Function, default: (v) => v },
})
const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)))
const pct = (v) => Math.max(v ? 3 : 0, (v / max.value) * 100)
const shortFormat = (v) => compact(v)
</script>

<style scoped>
.bars {
  display: flex;
  gap: 10px;
  align-items: stretch;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  background: var(--surface-2);
  border-radius: 10px;
  overflow: hidden;
}
.bar {
  width: 100%;
  border-radius: 10px;
  transition: height 0.4s ease;
}
.bar-val {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-2);
  height: 14px;
}
.bar-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}
</style>
