<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Expenses</h1>
        <p>Track what it costs to run {{ shop.name }} so you know your real profit.</p>
      </div>
    </div>

    <div class="grid grid-main">
      <div class="stack">
        <form class="card card-pad add" @submit.prevent="add">
          <div class="field grow"><label>Description</label><input v-model="form.title" class="input" required placeholder="e.g. Electricity bill" /></div>
          <div class="field">
            <label>Category</label>
            <select v-model="form.category" class="select">
              <option v-for="c in EXPENSE_CATEGORIES" :key="c">{{ c }}</option>
            </select>
          </div>
          <div class="field"><label>Amount ({{ cur }})</label><input v-model.number="form.amount" class="input" type="number" min="0.01" step="0.01" required /></div>
          <div class="field"><label>Date</label><input v-model="form.date" class="input" type="date" required /></div>
          <button class="btn btn-primary add-btn"><AppIcon name="plus" :size="18" /> Add</button>
        </form>

        <div class="card table-wrap">
          <table class="table">
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th><th></th></tr></thead>
            <tbody>
              <tr v-for="e in list" :key="e.id">
                <td class="small">{{ fmtDate(e.date) }}</td>
                <td><strong class="small">{{ e.title }}</strong></td>
                <td><span class="badge">{{ e.category }}</span></td>
                <td class="num strong">{{ money(e.amount, cur) }}</td>
                <td><div class="actions"><button class="btn-icon sm danger" @click="remove(e)"><AppIcon name="trash" :size="17" /></button></div></td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-if="!list.length" icon="wallet" title="No expenses recorded" text="Add rent, bills and restocks above." />
        </div>
      </div>

      <div class="stack">
        <StatCard icon="wallet" label="This month" :value="money(monthTotal, cur)" :hint="`${money(allTotal, cur)} all time`" tone="danger" />
        <div class="card">
          <div class="card-head"><h3>By category · this month</h3></div>
          <div class="card-body stack">
            <div v-for="c in byCategory" :key="c.name" class="cat-row">
              <div class="row between small"><span class="strong">{{ c.name }}</span><span>{{ money(c.total, cur) }}</span></div>
              <div class="track"><div class="fill" :style="{ width: (c.total / maxCat) * 100 + '%' }"></div></div>
            </div>
            <p v-if="!byCategory.length" class="muted small">Nothing spent this month yet.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import StatCard from '@/components/StatCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useCurrentShop } from '@/composables/useCurrentShop'
import { money, fmtDate, toDateInput, startOfMonth, sum } from '@/utils/format'
import { EXPENSE_CATEGORIES } from '@/data/categories'
import { toast } from '@/stores/toast'

const db = useDb()
const shop = useCurrentShop()
const cur = computed(() => db.settings.currency)
const form = reactive({ title: '', category: EXPENSE_CATEGORIES[0], amount: null, date: toDateInput(Date.now()) })

const list = computed(() => db.expenses.filter((e) => e.shopId === shop.value.id).sort((a, b) => b.date - a.date))
const month = computed(() => list.value.filter((e) => e.date >= startOfMonth()))
const monthTotal = computed(() => sum(month.value, (e) => e.amount))
const allTotal = computed(() => sum(list.value, (e) => e.amount))
const byCategory = computed(() => {
  const m = {}
  month.value.forEach((e) => (m[e.category] = (m[e.category] || 0) + e.amount))
  return Object.entries(m)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
})
const maxCat = computed(() => Math.max(1, ...byCategory.value.map((c) => c.total)))

function add() {
  const [y, mo, d] = form.date.split('-').map(Number)
  db.addExpense({ shopId: shop.value.id, title: form.title.trim(), category: form.category, amount: Number(form.amount), date: new Date(y, mo - 1, d, 12).getTime() })
  toast('Expense added')
  form.title = ''
  form.amount = null
}
function remove(e) {
  if (confirm(`Delete "${e.title}"?`)) db.deleteExpense(e.id)
}
</script>

<style scoped>
.add {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1.2fr auto;
  gap: 12px;
  align-items: end;
}
.add-btn {
  height: 42px;
}
.track {
  height: 8px;
  border-radius: 99px;
  background: var(--surface-2);
  overflow: hidden;
  margin-top: 6px;
}
.fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--accent), #ef4444);
}
@media (max-width: 1300px) {
  .add {
    grid-template-columns: 1fr 1fr;
  }
  .add .grow {
    grid-column: span 2;
  }
}
@media (max-width: 560px) {
  .add {
    grid-template-columns: 1fr;
  }
  .add .grow {
    grid-column: auto;
  }
}
</style>
