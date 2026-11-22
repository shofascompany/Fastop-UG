<template>
  <AppShell label="Shop Manager" :nav="nav">
    <template #sidebar-top>
      <div v-if="shop" class="shop-box">
        <div class="shop-mark" :style="{ background: cat.color + '22' }"><AppIcon :name="cat.icon" :size="20" :style="{ color: cat.color }" /></div>
        <div class="shop-meta">
          <strong class="truncate">{{ shop.name }}</strong>
          <span class="badge" :class="statusTone(shop.status)"><span class="dot"></span>{{ shop.status }}</span>
        </div>
      </div>
      <div v-if="isAdmin && db.shops.length" class="field admin-pick">
        <label>Managing as admin</label>
        <select class="select" :value="shop?.id" @change="auth.setAdminShop($event.target.value)">
          <option v-for="s in db.shops" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </template>

    <template #sidebar-bottom>
      <RouterLink v-if="isAdmin" :to="{ name: 'admin-dashboard' }" class="side-link"><AppIcon name="shield" :size="18" /> Back to Control Panel</RouterLink>
    </template>

    <template #topbar>
      <RouterLink v-if="shop && shop.status === 'active'" :to="{ name: 'explore-shop', params: { id: shop.id } }" class="btn btn-outline btn-sm hide-mobile">
        <AppIcon name="eye" :size="16" /> View public page
      </RouterLink>
      <RouterLink :to="{ name: 'shop-pos' }" class="btn btn-primary btn-sm"><AppIcon name="plus" :size="16" /> New sale</RouterLink>
    </template>

    <template v-if="!shop && !db.loaded" #default>
      <AppLoader text="Loading your shop" style="padding: 80px 0" />
    </template>
    <template v-else-if="!shop" #default>
      <EmptyState icon="store" title="No shop to manage" text="There are no shops on the platform yet. Shops appear here once a shop owner signs up." />
    </template>
    <template v-else-if="shop.status !== 'active'" #default>
      <div class="alert warning status-alert">
        <AppIcon name="alert" :size="18" />
        <span v-if="shop.status === 'pending'">This shop is <b>awaiting approval</b>. You can set everything up now. Customers will see your products once an admin approves the shop.</span>
        <span v-else>This shop is <b>suspended</b> and hidden from customers. Contact the administrator for help.</span>
      </div>
      <PageView />
    </template>
  </AppShell>
</template>

<script setup>
import { computed } from 'vue'
import AppShell from '@/components/AppShell.vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageView from '@/components/PageView.vue'
import AppLoader from '@/components/AppLoader.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { useCurrentShop } from '@/composables/useCurrentShop'
import { catById } from '@/data/categories'

const db = useDb()
const auth = useAuth()
const shop = useCurrentShop()
const isAdmin = computed(() => auth.user?.role === 'admin')
const cat = computed(() => catById(shop.value?.category))
const statusTone = (s) => ({ active: 'success', pending: 'warning', suspended: 'danger' })[s]

const newEnquiries = computed(() => (shop.value ? db.enquiries.filter((e) => e.shopId === shop.value.id && e.status === 'new').length : 0))
const lowStock = computed(() => (shop.value ? db.products.filter((p) => p.shopId === shop.value.id && p.stock <= 5).length : 0))

const nav = computed(() => [
  { label: 'Dashboard', icon: 'dashboard', to: { name: 'shop-dashboard' } },
  { label: 'Point of sale', icon: 'cart', to: { name: 'shop-pos' } },
  { label: 'Inventory', icon: 'box', to: { name: 'shop-products' }, count: lowStock.value },
  { label: 'Sales', icon: 'receipt', to: { name: 'shop-sales' } },
  { label: 'Expenses', icon: 'wallet', to: { name: 'shop-expenses' } },
  { label: 'Enquiries', icon: 'message', to: { name: 'shop-enquiries' }, count: newEnquiries.value },
  { label: 'Shop profile', icon: 'store', to: { name: 'shop-profile' } },
])
</script>

<style scoped>
.shop-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin: 4px 0 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-2);
}
.shop-mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 22px;
  flex: none;
}
.shop-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.shop-meta strong {
  font-size: 14px;
}
.shop-meta .badge {
  align-self: flex-start;
}
.admin-pick {
  padding: 0 4px 10px;
}
.status-alert {
  margin-bottom: 18px;
}
</style>
