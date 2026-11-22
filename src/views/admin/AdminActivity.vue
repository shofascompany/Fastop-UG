<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Activity log</h1>
        <p>An audit trail of sign-ins, registrations, listings and changes.</p>
      </div>
      <button class="btn btn-outline" :disabled="!db.activity.length" @click="clear"><AppIcon name="trash" :size="17" /> Clear log</button>
    </div>

    <div class="chips">
      <button v-for="t in types" :key="t.id" class="chip" :class="{ active: type === t.id }" @click="type = t.id">{{ t.label }}</button>
    </div>

    <div class="card">
      <ul v-if="filtered.length" class="list-plain log">
        <li v-for="a in filtered" :key="a.id">
          <span class="log-icon"><AppIcon :name="icon(a.type)" :size="16" /></span>
          <div class="log-text">
            <span>{{ a.message }}</span>
            <small class="muted">{{ fmtDateTime(a.at) }}</small>
          </div>
          <span class="badge">{{ a.type }}</span>
        </li>
      </ul>
      <EmptyState v-else icon="activity" title="Nothing logged yet" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { fmtDateTime } from '@/utils/format'

const db = useDb()
const type = ref('all')
const types = [
  { id: 'all', label: 'All' },
  { id: 'auth', label: 'Sign-ins' },
  { id: 'user', label: 'Users' },
  { id: 'shop', label: 'Shops' },
  { id: 'product', label: 'Products' },
  { id: 'system', label: 'System' },
]
const icon = (t) => ({ user: 'user', shop: 'store', product: 'box', auth: 'lock', system: 'settings' })[t] || 'activity'
const filtered = computed(() => db.activity.filter((a) => type.value === 'all' || a.type === type.value))

function clear() {
  if (confirm('Clear the entire activity log?')) db.clearActivity()
}
</script>

<style scoped>
.log li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
}
.log li:last-child {
  border-bottom: none;
}
.log-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--brand-50);
  color: var(--brand);
  flex: none;
}
.log-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
</style>
