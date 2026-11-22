<template>
  <AppShell label="Control Panel" theme="dark" :nav="nav">
    <template #sidebar-bottom>
      <div class="switch-box">
        <span class="switch-title">Jump to interface</span>
        <RouterLink :to="{ name: 'shop-dashboard' }" class="side-link"><AppIcon name="store" :size="18" /> Shop Manager</RouterLink>
        <RouterLink :to="{ name: 'explore-home' }" class="side-link"><AppIcon name="eye" :size="18" /> Customer view</RouterLink>
      </div>
    </template>
    <template #topbar>
      <span class="badge brand"><AppIcon name="shield" :size="14" /> Administrator</span>
    </template>
  </AppShell>
</template>

<script setup>
import { computed } from 'vue'
import AppShell from '@/components/AppShell.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useDb } from '@/stores/db'

const db = useDb()
const pending = computed(() => db.shops.filter((s) => s.status === 'pending').length)

const nav = computed(() => [
  { label: 'Overview', icon: 'dashboard', to: { name: 'admin-dashboard' } },
  { label: 'Users', icon: 'users', to: { name: 'admin-users' } },
  { label: 'Shops', icon: 'store', to: { name: 'admin-shops' }, count: pending.value },
  { label: 'Products', icon: 'box', to: { name: 'admin-products' } },
  { label: 'Activity log', icon: 'activity', to: { name: 'admin-activity' } },
  { label: 'Settings', icon: 'settings', to: { name: 'admin-settings' } },
])
</script>

<style scoped>
.switch-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.switch-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
  padding: 4px 12px;
}
</style>
