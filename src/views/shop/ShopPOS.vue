<template>
  <div class="pos">
    <!-- Product picker -->
    <section class="pos-products">
      <div class="page-head">
        <div>
          <h1>Point of sale</h1>
          <p>Tap products to add them to the sale.</p>
        </div>
      </div>
      <div class="toolbar">
        <div class="input-icon">
          <AppIcon name="search" :size="18" />
          <input v-model="q" class="input" placeholder="Search products or scan SKU…" />
        </div>
      </div>
      <div class="chips scroll">
        <button class="chip" :class="{ active: cat === 'all' }" @click="cat = 'all'">All</button>
        <button v-for="c in usedCats" :key="c.id" class="chip" :class="{ active: cat === c.id }" @click="cat = c.id">{{ c.label }}</button>
      </div>

      <div v-if="list.length" class="tiles">
        <button v-for="p in list" :key="p.id" class="tile" :disabled="available(p) <= 0" @click="add(p)">
          <ProductImage :product="p" icon-size="34px" />
          <span class="tile-name">{{ p.name }}</span>
          <span class="tile-row">
            <b>{{ money(p.price, cur) }}</b>
            <small :class="{ low: available(p) <= 5 }">{{ available(p) <= 0 ? 'Out of stock' : `${available(p)} in stock` }}</small>
          </span>
          <span v-if="inCart(p)" class="tile-qty">{{ inCart(p) }}</span>
        </button>
      </div>
      <EmptyState v-else icon="box" title="No products to sell" text="Add products to your inventory first.">
        <RouterLink :to="{ name: 'shop-products' }" class="btn btn-primary">Go to inventory</RouterLink>
      </EmptyState>
    </section>

    <!-- Cart -->
    <aside class="cart card">
      <div class="card-head">
        <h3><AppIcon name="cart" :size="18" /> Current sale</h3>
        <button v-if="cart.length" class="btn btn-ghost btn-sm" @click="cart = []">Clear</button>
      </div>
      <ul v-if="cart.length" class="list-plain lines">
        <li v-for="line in cart" :key="line.productId">
          <div class="line-main">
            <strong class="truncate">{{ line.name }}</strong>
            <small class="muted">{{ money(line.price, cur) }} each</small>
          </div>
          <div class="qty">
            <button class="btn-icon sm" @click="change(line, -1)"><AppIcon name="minus" :size="14" /></button>
            <span>{{ line.qty }}</span>
            <button class="btn-icon sm" @click="change(line, 1)" :disabled="line.qty >= line.max"><AppIcon name="plus" :size="14" /></button>
          </div>
          <strong class="line-total">{{ money(line.qty * line.price, cur) }}</strong>
        </li>
      </ul>
      <EmptyState v-else icon="cart" title="Cart is empty" text="Select products on the left." />

      <div class="cart-foot">
        <div class="field">
          <label>Payment method</label>
          <div class="pay">
            <button v-for="m in PAYMENT_METHODS" :key="m" type="button" class="chip" :class="{ active: payment === m }" @click="payment = m">{{ m }}</button>
          </div>
        </div>
        <div class="field">
          <label>Customer name (optional)</label>
          <input v-model="customer" class="input" placeholder="Walk-in customer" />
        </div>
        <div class="totals">
          <div class="row between"><span class="muted">Items</span><span>{{ itemCount }}</span></div>
          <div class="row between total"><span>Total</span><span>{{ money(total, cur) }}</span></div>
        </div>
        <button class="btn btn-primary btn-lg btn-block" :disabled="!cart.length" @click="checkout">
          <AppIcon name="check" :size="18" /> Complete sale
        </button>
      </div>
    </aside>

    <BaseModal :open="!!receipt" title="Sale complete" width="420px" @close="receipt = null">
      <div v-if="receipt" class="receipt">
        <div class="receipt-head">
          <div class="ok"><AppIcon name="check" :size="26" /></div>
          <strong>{{ shop.name }}</strong>
          <small class="muted">{{ fmtDateTime(receipt.createdAt) }} · #{{ receipt.id.slice(-6).toUpperCase() }}</small>
        </div>
        <div v-for="i in receipt.items" :key="i.productId" class="row between r-line">
          <span>{{ i.qty }} × {{ i.name }}</span><span>{{ money(i.qty * i.price, cur) }}</span>
        </div>
        <div class="row between r-total"><span>Total</span><span>{{ money(receipt.total, cur) }}</span></div>
        <div class="muted small">Paid by {{ receipt.paymentMethod }}<span v-if="receipt.customerName"> · {{ receipt.customerName }}</span></div>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="print"><AppIcon name="printer" :size="17" /> Print</button>
        <button class="btn btn-primary" @click="receipt = null">New sale</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProductImage from '@/components/ProductImage.vue'
import { useDb } from '@/stores/db'
import { useCurrentShop } from '@/composables/useCurrentShop'
import { money, fmtDateTime, sum } from '@/utils/format'
import { CATEGORIES, PAYMENT_METHODS } from '@/data/categories'
import { toast } from '@/stores/toast'

const db = useDb()
const shop = useCurrentShop()
const cur = computed(() => db.settings.currency)

const q = ref('')
const cat = ref('all')
const cart = ref([])
const payment = ref(PAYMENT_METHODS[0])
const customer = ref('')
const receipt = ref(null)

const products = computed(() => db.products.filter((p) => p.shopId === shop.value.id))
const usedCats = computed(() => CATEGORIES.filter((c) => products.value.some((p) => p.category === c.id)))
const list = computed(() => {
  const term = q.value.trim().toLowerCase()
  return products.value
    .filter((p) => cat.value === 'all' || p.category === cat.value)
    .filter((p) => !term || p.name.toLowerCase().includes(term) || (p.sku || '').toLowerCase() === term)
})

const inCart = (p) => cart.value.find((l) => l.productId === p.id)?.qty || 0
const available = (p) => p.stock - inCart(p)

function add(p) {
  const line = cart.value.find((l) => l.productId === p.id)
  if (line) {
    if (line.qty < p.stock) line.qty++
  } else if (p.stock > 0) {
    cart.value.push({ productId: p.id, name: p.name, price: p.price, cost: p.cost || 0, qty: 1, max: p.stock })
  }
}
function change(line, d) {
  line.qty += d
  if (line.qty <= 0) cart.value = cart.value.filter((l) => l !== line)
}

const itemCount = computed(() => sum(cart.value, (l) => l.qty))
const total = computed(() => sum(cart.value, (l) => l.qty * l.price))

function checkout() {
  const items = cart.value.map(({ max, ...rest }) => rest)
  receipt.value = db.recordSale({ shopId: shop.value.id, items, paymentMethod: payment.value, customerName: customer.value.trim() })
  toast(`Sale recorded · ${money(receipt.value.total, cur.value)}`)
  cart.value = []
  customer.value = ''
}
const print = () => window.print()
</script>

<style scoped>
.pos {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 22px;
  align-items: start;
}
.pos-products {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
}
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  color: var(--text);
  text-align: left;
  transition: 0.15s;
}
.tile:hover:not(:disabled) {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-100);
}
.tile:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.tile-name {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.3;
  padding: 0 4px;
}
.tile-row {
  display: flex;
  flex-direction: column;
  padding: 0 4px 4px;
}
.tile-row small {
  color: var(--muted);
  font-size: 12px;
}
.tile-row small.low {
  color: var(--warning);
  font-weight: 600;
}
.tile-qty {
  position: absolute;
  top: 16px;
  right: 16px;
  min-width: 28px;
  height: 28px;
  border-radius: 99px;
  background: var(--brand);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  display: grid;
  place-items: center;
}
.cart {
  position: sticky;
  top: 84px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 110px);
}
.cart .card-head h3 {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lines {
  overflow-y: auto;
  flex: 1;
}
.lines li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
}
.line-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.line-main strong {
  font-size: 14px;
}
.qty {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 2px;
}
.qty .btn-icon {
  width: 26px;
  height: 26px;
}
.qty span {
  min-width: 22px;
  text-align: center;
  font-weight: 700;
}
.line-total {
  font-size: 14px;
  min-width: 70px;
  text-align: right;
}
.cart-foot {
  padding: 18px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pay {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pay .chip {
  height: 32px;
  font-size: 12.5px;
}
.totals {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}
.total {
  font-size: 20px;
  font-weight: 800;
}
.receipt {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.receipt-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 14px;
  border-bottom: 1px dashed var(--border);
  margin-bottom: 4px;
}
.ok {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--success-50);
  color: var(--success);
  display: grid;
  place-items: center;
  margin-bottom: 6px;
}
.r-line {
  font-size: 14px;
}
.r-total {
  font-weight: 800;
  font-size: 18px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
}
@media (max-width: 1100px) {
  .pos {
    grid-template-columns: 1fr;
  }
  .cart {
    position: static;
    max-height: none;
  }
}
</style>
