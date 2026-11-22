<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Sales</h1>
        <p>Every transaction recorded at your point of sale.</p>
      </div>
      <RouterLink :to="{ name: 'shop-pos' }" class="btn btn-primary"><AppIcon name="plus" :size="18" /> New sale</RouterLink>
    </div>

    <div class="stats">
      <StatCard icon="receipt" label="Revenue" :value="money(revenue, cur)" :hint="rangeLabel" />
      <StatCard icon="cart" label="Transactions" :value="filtered.length" :hint="`${itemsSold} items sold`" tone="info" />
      <StatCard icon="trend" label="Gross profit" :value="money(profit, cur)" hint="revenue − cost of goods" tone="success" />
      <StatCard icon="tag" label="Average sale" :value="money(filtered.length ? revenue / filtered.length : 0, cur)" tone="warning" />
    </div>

    <div class="toolbar">
      <div class="chips">
        <button v-for="r in ranges" :key="r.id" class="chip" :class="{ active: range === r.id }" @click="range = r.id">{{ r.label }}</button>
      </div>
      <div class="input-icon">
        <AppIcon name="search" :size="18" />
        <input v-model="q" class="input" placeholder="Search by product or customer…" />
      </div>
      <select v-model="method" class="select">
        <option value="all">All payment methods</option>
        <option v-for="m in PAYMENT_METHODS" :key="m">{{ m }}</option>
      </select>
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr><th>Date</th><th>Items</th><th>Customer</th><th>Payment</th><th class="num">Total</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id">
            <td class="small nowrap">{{ fmtDateTime(s.createdAt) }}</td>
            <td class="small">{{ s.items.map((i) => `${i.qty}× ${i.name}`).join(', ') }}</td>
            <td class="small">{{ s.customerName || '-' }}</td>
            <td><span class="badge">{{ s.paymentMethod }}</span></td>
            <td class="num strong">{{ money(s.total, cur) }}</td>
            <td>
              <div class="actions">
                <button class="btn-icon sm" title="View receipt" @click="view = s"><AppIcon name="receipt" :size="17" /></button>
                <button class="btn-icon sm danger" title="Void sale" @click="remove(s)"><AppIcon name="trash" :size="17" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!filtered.length" icon="receipt" title="No sales in this period" />
    </div>

    <BaseModal :open="!!view" title="Receipt" width="420px" @close="view = null">
      <div v-if="view" class="stack">
        <div class="muted small">{{ fmtDateTime(view.createdAt) }} · #{{ view.id.slice(-6).toUpperCase() }}</div>
        <div v-for="i in view.items" :key="i.productId" class="row between small">
          <span>{{ i.qty }} × {{ i.name }}</span><span>{{ money(i.qty * i.price, cur) }}</span>
        </div>
        <div class="row between strong total"><span>Total</span><span>{{ money(view.total, cur) }}</span></div>
        <div class="muted small">Paid by {{ view.paymentMethod }}<span v-if="view.customerName"> · {{ view.customerName }}</span></div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import StatCard from '@/components/StatCard.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useCurrentShop } from '@/composables/useCurrentShop'
import { money, fmtDateTime, startOfDay, sum, DAY } from '@/utils/format'
import { PAYMENT_METHODS } from '@/data/categories'
import { toast } from '@/stores/toast'

const db = useDb()
const shop = useCurrentShop()
const cur = computed(() => db.settings.currency)

const ranges = [
  { id: 'today', label: 'Today' },
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: 'all', label: 'All time' },
]
const range = ref('7')
const q = ref('')
const method = ref('all')
const view = ref(null)
const rangeLabel = computed(() => ranges.find((r) => r.id === range.value).label)

const filtered = computed(() => {
  const from = range.value === 'today' ? startOfDay(Date.now()) : range.value === 'all' ? 0 : Date.now() - Number(range.value) * DAY
  const term = q.value.trim().toLowerCase()
  return db.sales
    .filter((s) => s.shopId === shop.value.id && s.createdAt >= from)
    .filter((s) => method.value === 'all' || s.paymentMethod === method.value)
    .filter((s) => !term || s.customerName.toLowerCase().includes(term) || s.items.some((i) => i.name.toLowerCase().includes(term)))
    .sort((a, b) => b.createdAt - a.createdAt)
})
const revenue = computed(() => sum(filtered.value, (s) => s.total))
const itemsSold = computed(() => sum(filtered.value.flatMap((s) => s.items), (i) => i.qty))
const profit = computed(() => revenue.value - sum(filtered.value.flatMap((s) => s.items), (i) => i.qty * (i.cost || 0)))

function remove(s) {
  if (!confirm('Void this sale? Items will be returned to stock.')) return
  db.deleteSale(s.id, true)
  toast('Sale voided and stock restored', 'info')
}
</script>

<style scoped>
.nowrap {
  white-space: nowrap;
}
.total {
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  font-size: 17px;
}
</style>
