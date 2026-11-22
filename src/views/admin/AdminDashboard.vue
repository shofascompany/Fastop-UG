<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Platform overview</h1>
        <p>Everything happening across Fastop at a glance.</p>
      </div>
      <div class="row">
        <RouterLink :to="{ name: 'admin-shops' }" class="btn btn-outline"><AppIcon name="store" :size="18" /> Manage shops</RouterLink>
        <RouterLink :to="{ name: 'admin-users' }" class="btn btn-primary"><AppIcon name="users" :size="18" /> Manage users</RouterLink>
      </div>
    </div>

    <div class="stats">
      <StatCard icon="users" label="Total users" :value="db.users.length" :hint="`${roleCount('shop')} shop owners · ${roleCount('customer')} customers`" />
      <StatCard icon="store" label="Shops" :value="db.shops.length" :hint="`${activeShops} live · ${pending.length} pending`" tone="accent" />
      <StatCard icon="box" label="Listed products" :value="db.products.length" :hint="`${db.publicProducts.length} visible to customers`" tone="info" />
      <StatCard icon="trend" label="Platform sales (all time)" :value="money(revenue, cur)" :hint="`${db.sales.length} transactions`" tone="success" />
    </div>

    <div class="grid grid-main">
      <div class="card">
        <div class="card-head">
          <h3>Sales across all shops · last 7 days</h3>
          <span class="badge success">{{ money(weekTotal, cur) }}</span>
        </div>
        <div class="card-body"><BarChart :data="days" :format="(v) => money(v, cur)" /></div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Awaiting approval</h3>
          <span class="badge warning">{{ pending.length }}</span>
        </div>
        <ul v-if="pending.length" class="list-plain approvals">
          <li v-for="s in pending" :key="s.id">
            <div class="mark"><AppIcon :name="catById(s.category).icon" :size="20" :style="{ color: catById(s.category).color }" /></div>
            <div class="meta">
              <strong class="truncate">{{ s.name }}</strong>
              <small class="muted">{{ owner(s)?.email }} · {{ timeAgo(s.createdAt) }}</small>
            </div>
            <button class="btn btn-sm btn-primary" @click="approve(s)"><AppIcon name="check" :size="15" /> Approve</button>
          </li>
        </ul>
        <EmptyState v-else icon="check" title="All caught up" text="No shops are waiting for approval." />
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-head">
          <h3>Top shops by revenue</h3>
          <RouterLink :to="{ name: 'admin-shops' }" class="btn btn-ghost btn-sm">View all</RouterLink>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Shop</th><th class="num">Products</th><th class="num">Revenue</th><th></th></tr></thead>
            <tbody>
              <tr v-for="s in topShops" :key="s.id">
                <td>
                  <div class="cell-main">
                    <span class="emoji"><AppIcon :name="catById(s.category).icon" :size="20" :style="{ color: catById(s.category).color }" /></span>
                    <div><strong>{{ s.name }}</strong><small>{{ catById(s.category).label }}</small></div>
                  </div>
                </td>
                <td class="num">{{ s.productCount }}</td>
                <td class="num strong">{{ money(s.revenue, cur) }}</td>
                <td class="num"><button class="btn btn-soft btn-sm" @click="manage(s)">Manage</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Recent activity</h3>
          <RouterLink :to="{ name: 'admin-activity' }" class="btn btn-ghost btn-sm">Full log</RouterLink>
        </div>
        <ul class="list-plain feed">
          <li v-for="a in db.activity.slice(0, 7)" :key="a.id">
            <span class="feed-icon" :class="a.type"><AppIcon :name="typeIcon(a.type)" :size="15" /></span>
            <span class="feed-text">{{ a.message }}</span>
            <small class="muted">{{ timeAgo(a.at) }}</small>
          </li>
        </ul>
      </div>
    </div>

    <div class="card card-pad launch">
      <div>
        <h3>Jump into another interface</h3>
        <p class="muted">As admin you can operate any shop's business manager or preview the customer showcase.</p>
      </div>
      <div class="row wrap">
        <RouterLink :to="{ name: 'shop-dashboard' }" class="btn btn-outline"><AppIcon name="store" :size="18" /> Shop Manager</RouterLink>
        <RouterLink :to="{ name: 'explore-home' }" class="btn btn-accent"><AppIcon name="eye" :size="18" /> Customer view</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import StatCard from '@/components/StatCard.vue'
import BarChart from '@/components/BarChart.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { money, timeAgo, lastNDays, startOfDay, sum } from '@/utils/format'
import { catById } from '@/data/categories'
import { toast } from '@/stores/toast'

const db = useDb()
const auth = useAuth()
const router = useRouter()
const cur = computed(() => db.settings.currency)

const roleCount = (r) => db.users.filter((u) => u.role === r).length
const activeShops = computed(() => db.shops.filter((s) => s.status === 'active').length)
const pending = computed(() => db.shops.filter((s) => s.status === 'pending'))
const revenue = computed(() => sum(db.sales, (s) => s.total))
const owner = (s) => db.users.find((u) => u.id === s.ownerId)

const days = computed(() =>
  lastNDays(7).map((d) => ({ label: d.label, value: sum(db.sales.filter((s) => startOfDay(s.createdAt) === d.key), (s) => s.total) })),
)
const weekTotal = computed(() => sum(days.value, (d) => d.value))

const topShops = computed(() =>
  db.shops
    .map((s) => ({
      ...s,
      revenue: sum(db.sales.filter((x) => x.shopId === s.id), (x) => x.total),
      productCount: db.products.filter((p) => p.shopId === s.id).length,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5),
)

const typeIcon = (t) => ({ user: 'user', shop: 'store', product: 'box', auth: 'lock', system: 'settings' })[t] || 'activity'

function approve(s) {
  db.updateShop(s.id, { status: 'active' })
  toast(`${s.name} is now live`)
}
function manage(s) {
  auth.setAdminShop(s.id)
  router.push({ name: 'shop-dashboard' })
}
</script>

<style scoped>
.approvals li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
}
.approvals li:last-child {
  border-bottom: none;
}
.mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--surface-2);
  display: grid;
  place-items: center;
  font-size: 20px;
  flex: none;
}
.meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.emoji {
  font-size: 22px;
}
.feed li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.feed li:last-child {
  border-bottom: none;
}
.feed-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: var(--brand-50);
  color: var(--brand);
  flex: none;
}
.feed-icon.shop {
  background: var(--grad-accent-soft);
  color: var(--accent-700);
}
.feed-icon.product {
  background: var(--info-50);
  color: var(--info);
}
.feed-icon.auth {
  background: var(--success-50);
  color: var(--success);
}
.feed-text {
  flex: 1;
  min-width: 0;
}
.launch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, var(--brand-50), var(--accent-50));
}
.launch h3 {
  margin-bottom: 4px;
}
</style>
