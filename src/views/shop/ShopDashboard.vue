<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Good {{ greeting }}, {{ ownerFirst }}</h1>
        <p>Here's how {{ shop.name }} is doing.</p>
      </div>
      <div class="row">
        <RouterLink :to="{ name: 'shop-products' }" class="btn btn-outline"><AppIcon name="plus" :size="18" /> Add product</RouterLink>
        <RouterLink :to="{ name: 'shop-pos' }" class="btn btn-primary"><AppIcon name="cart" :size="18" /> Record a sale</RouterLink>
      </div>
    </div>

    <div class="stats">
      <StatCard icon="receipt" label="Today's sales" :value="money(today, cur)" :hint="`${todayCount} transactions`" />
      <StatCard icon="trend" label="This month revenue" :value="money(monthRevenue, cur)" :hint="`${monthSales.length} sales`" tone="info" />
      <StatCard icon="wallet" label="This month profit" :value="money(monthProfit, cur)" :hint="`after ${money(monthExpenses, cur)} expenses`" :tone="monthProfit >= 0 ? 'success' : 'danger'" />
      <StatCard icon="eye" label="Product views (ads)" :value="views" :hint="`${products.filter((p) => p.visible).length} products advertised`" tone="warning" />
    </div>

    <div class="grid grid-main">
      <div class="card">
        <div class="card-head">
          <h3>Revenue · last 7 days</h3>
          <span class="badge brand">{{ money(weekTotal, cur) }}</span>
        </div>
        <div class="card-body"><BarChart :data="days" :format="(v) => money(v, cur)" /></div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Low stock</h3>
          <RouterLink :to="{ name: 'shop-products' }" class="btn btn-ghost btn-sm">Inventory</RouterLink>
        </div>
        <ul v-if="lowStock.length" class="list-plain items">
          <li v-for="p in lowStock" :key="p.id">
            <ProductImage :product="p" size="38px" icon-size="18px" round />
            <span class="truncate grow">{{ p.name }}</span>
            <span class="badge" :class="p.stock === 0 ? 'danger' : 'warning'">{{ p.stock === 0 ? 'Out' : `${p.stock} left` }}</span>
          </li>
        </ul>
        <EmptyState v-else icon="check" title="Stock looks healthy" text="Nothing is running low right now." />
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-head">
          <h3>Recent sales</h3>
          <RouterLink :to="{ name: 'shop-sales' }" class="btn btn-ghost btn-sm">All sales</RouterLink>
        </div>
        <div v-if="recent.length" class="table-wrap">
          <table class="table">
            <tbody>
              <tr v-for="s in recent" :key="s.id">
                <td>
                  <strong class="small">{{ s.items.map((i) => i.name).join(', ') }}</strong><br />
                  <span class="muted small">{{ timeAgo(s.createdAt) }} · {{ s.paymentMethod }}</span>
                </td>
                <td class="num strong">{{ money(s.total, cur) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <EmptyState v-else icon="receipt" title="No sales yet" text="Your first sale will show up here." />
      </div>

      <div class="card">
        <div class="card-head"><h3>Best sellers · 30 days</h3></div>
        <ul v-if="best.length" class="list-plain items">
          <li v-for="(b, i) in best" :key="b.id">
            <span class="rank">{{ i + 1 }}</span>
            <span class="truncate grow">{{ b.name }}</span>
            <span class="muted small">{{ b.qty }} sold</span>
            <strong class="small">{{ money(b.revenue, cur) }}</strong>
          </li>
        </ul>
        <EmptyState v-else icon="chart" title="No data yet" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import StatCard from '@/components/StatCard.vue'
import BarChart from '@/components/BarChart.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProductImage from '@/components/ProductImage.vue'
import { useDb } from '@/stores/db'
import { useCurrentShop } from '@/composables/useCurrentShop'
import { money, timeAgo, lastNDays, startOfDay, startOfMonth, sum, DAY } from '@/utils/format'

const db = useDb()
const shop = useCurrentShop()
const cur = computed(() => db.settings.currency)

const owner = computed(() => db.users.find((u) => u.id === shop.value.ownerId))
const ownerFirst = computed(() => owner.value?.name.split(' ')[0] || 'there')
const hour = new Date().getHours()
const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

const products = computed(() => db.products.filter((p) => p.shopId === shop.value.id))
const sales = computed(() => db.sales.filter((s) => s.shopId === shop.value.id))
const todayStart = startOfDay(Date.now())
const todaySales = computed(() => sales.value.filter((s) => s.createdAt >= todayStart))
const today = computed(() => sum(todaySales.value, (s) => s.total))
const todayCount = computed(() => todaySales.value.length)

const monthStart = startOfMonth()
const monthSales = computed(() => sales.value.filter((s) => s.createdAt >= monthStart))
const monthRevenue = computed(() => sum(monthSales.value, (s) => s.total))
const monthCogs = computed(() => sum(monthSales.value.flatMap((s) => s.items), (i) => i.qty * (i.cost || 0)))
const monthExpenses = computed(() => sum(db.expenses.filter((e) => e.shopId === shop.value.id && e.date >= monthStart), (e) => e.amount))
const monthProfit = computed(() => monthRevenue.value - monthCogs.value - monthExpenses.value)
const views = computed(() => sum(products.value, (p) => p.views || 0))

const days = computed(() =>
  lastNDays(7).map((d) => ({ label: d.label, value: sum(sales.value.filter((s) => startOfDay(s.createdAt) === d.key), (s) => s.total) })),
)
const weekTotal = computed(() => sum(days.value, (d) => d.value))

const lowStock = computed(() => products.value.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6))
const recent = computed(() => [...sales.value].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6))

const best = computed(() => {
  const map = {}
  sales.value
    .filter((s) => s.createdAt >= Date.now() - 30 * DAY)
    .flatMap((s) => s.items)
    .forEach((i) => {
      map[i.productId] = map[i.productId] || { id: i.productId, name: i.name, qty: 0, revenue: 0 }
      map[i.productId].qty += i.qty
      map[i.productId].revenue += i.qty * i.price
    })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
})
</script>

<style scoped>
.items li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.items li:last-child {
  border-bottom: none;
}
.grow {
  flex: 1;
  min-width: 0;
  font-weight: 600;
}
.rank {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--brand-50);
  color: var(--brand-700);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 12px;
  flex: none;
}
</style>
