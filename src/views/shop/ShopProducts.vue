<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Inventory</h1>
        <p>{{ products.length }} products · stock value {{ money(stockValue, cur) }}</p>
      </div>
      <button class="btn btn-primary" @click="openNew"><AppIcon name="plus" :size="18" /> Add product</button>
    </div>

    <div class="toolbar">
      <div class="input-icon">
        <AppIcon name="search" :size="18" />
        <input v-model="q" class="input" placeholder="Search by name or SKU…" />
      </div>
      <select v-model="cat" class="select">
        <option value="all">All categories</option>
        <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
      </select>
      <label class="switch"><input v-model="lowOnly" type="checkbox" /> Low stock only</label>
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Product</th><th>Category</th><th class="num">Cost</th><th class="num">Price</th><th class="num">Margin</th><th>Stock</th><th class="num">Views</th><th>Advertised</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id">
            <td>
              <div class="cell-main">
                <ProductImage :product="p" size="44px" icon-size="22px" round />
                <div><strong>{{ p.name }} <AppIcon v-if="p.featured" name="star" :size="13" class="star" /></strong><small>{{ p.sku }}</small></div>
              </div>
            </td>
            <td class="small">{{ catById(p.category).label }}</td>
            <td class="num muted">{{ money(p.cost, cur) }}</td>
            <td class="num strong">{{ money(p.price, cur) }}</td>
            <td class="num small" :class="margin(p) >= 0 ? 'text-success' : 'text-danger'">{{ margin(p) }}%</td>
            <td>
              <div class="stock">
                <button class="btn-icon sm" @click="adjust(p, -1)" :disabled="p.stock <= 0" aria-label="Decrease"><AppIcon name="minus" :size="14" /></button>
                <span class="stock-n" :class="{ low: p.stock <= 5, out: p.stock === 0 }">{{ p.stock }}</span>
                <button class="btn-icon sm" @click="adjust(p, 1)" aria-label="Increase"><AppIcon name="plus" :size="14" /></button>
              </div>
            </td>
            <td class="num muted">{{ p.views || 0 }}</td>
            <td><label class="switch"><input type="checkbox" :checked="p.visible" @change="db.updateProduct(p.id, { visible: $event.target.checked })" /></label></td>
            <td>
              <div class="actions">
                <button class="btn-icon sm" title="Edit" @click="openEdit(p)"><AppIcon name="edit" :size="17" /></button>
                <button class="btn-icon sm danger" title="Delete" @click="remove(p)"><AppIcon name="trash" :size="17" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!filtered.length" icon="box" :title="products.length ? 'No matching products' : 'No products yet'" :text="products.length ? 'Try a different search.' : 'Add your first product to start selling and advertising.'">
        <button v-if="!products.length" class="btn btn-primary" @click="openNew"><AppIcon name="plus" :size="18" /> Add product</button>
      </EmptyState>
    </div>

    <BaseModal :open="modal" :title="form.id ? 'Edit product' : 'Add product'" width="640px" @close="modal = false">
      <form id="productForm" class="form-grid" @submit.prevent="save">
        <div class="field span-2"><label>Product name *</label><input v-model="form.name" class="input" required placeholder="e.g. Wireless Earbuds" /></div>
        <div class="field">
          <label>Category</label>
          <select v-model="form.category" class="select">
            <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </div>
        <div class="field"><label>SKU</label><input v-model="form.sku" class="input" placeholder="Auto-generated if empty" /></div>
        <div class="field"><label>Cost price ({{ cur }})</label><input v-model.number="form.cost" class="input" type="number" min="0" step="0.01" /></div>
        <div class="field"><label>Selling price ({{ cur }}) *</label><input v-model.number="form.price" class="input" type="number" min="0" step="0.01" required /></div>
        <div class="field"><label>Stock quantity</label><input v-model.number="form.stock" class="input" type="number" min="0" step="1" /></div>
        <div class="field"><label>Image URL</label><input v-model="form.image" class="input" type="url" placeholder="https://… (optional)" /></div>
        <div class="field span-2"><label>Description</label><textarea v-model="form.description" class="textarea" placeholder="What makes this product great? Customers will see this."></textarea></div>
        <div class="span-2 stack">
          <label class="switch"><input v-model="form.visible" type="checkbox" /> Advertise in the customer showcase</label>
          <label class="switch"><input v-model="form.featured" type="checkbox" /> Feature this product (highlighted to customers)</label>
          <p class="hint">Only you see the price. Customers see the name, description and whether it's in stock.</p>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-outline" @click="modal = false">Cancel</button>
        <button class="btn btn-primary" type="submit" form="productForm">{{ form.id ? 'Save changes' : 'Add product' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProductImage from '@/components/ProductImage.vue'
import { useDb } from '@/stores/db'
import { useCurrentShop } from '@/composables/useCurrentShop'
import { money, sum } from '@/utils/format'
import { CATEGORIES, catById } from '@/data/categories'
import { toast } from '@/stores/toast'

const db = useDb()
const shop = useCurrentShop()
const cur = computed(() => db.settings.currency)
const q = ref('')
const cat = ref('all')
const lowOnly = ref(false)

const products = computed(() => db.products.filter((p) => p.shopId === shop.value.id))
const stockValue = computed(() => sum(products.value, (p) => p.stock * (p.cost || 0)))
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return products.value
    .filter((p) => cat.value === 'all' || p.category === cat.value)
    .filter((p) => !lowOnly.value || p.stock <= 5)
    .filter((p) => !term || p.name.toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term))
})
const margin = (p) => (p.price ? Math.round(((p.price - (p.cost || 0)) / p.price) * 100) : 0)

function adjust(p, d) {
  db.updateProduct(p.id, { stock: Math.max(0, p.stock + d) })
}

const modal = ref(false)
const blank = () => ({ id: null, name: '', category: shop.value.category || 'other', sku: '', cost: 0, price: 0, stock: 0, image: '', description: '', visible: true, featured: false })
const form = reactive(blank())

function openNew() {
  Object.assign(form, blank())
  modal.value = true
}
function openEdit(p) {
  Object.assign(form, blank(), JSON.parse(JSON.stringify(p)))
  modal.value = true
}
function save() {
  const data = { ...form, name: form.name.trim(), price: Number(form.price) || 0, cost: Number(form.cost) || 0, stock: Math.max(0, Math.floor(Number(form.stock) || 0)), shopId: shop.value.id }
  if (!data.id) delete data.id
  db.saveProduct(data)
  toast(form.id ? 'Product updated' : 'Product added')
  modal.value = false
}
function remove(p) {
  if (!confirm(`Delete "${p.name}"?`)) return
  db.deleteProduct(p.id)
  toast('Product deleted', 'info')
}
</script>

<style scoped>
.star {
  color: var(--accent);
  fill: var(--accent);
}
.stock {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 2px;
}
.stock .btn-icon {
  width: 26px;
  height: 26px;
}
.stock-n {
  min-width: 30px;
  text-align: center;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.stock-n.low {
  color: var(--warning);
}
.stock-n.out {
  color: var(--danger);
}
</style>
