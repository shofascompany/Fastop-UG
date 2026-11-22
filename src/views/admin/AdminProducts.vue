<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Products</h1>
        <p>Moderate every listing on the platform. Hidden products never reach the customer showcase.</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="input-icon">
        <AppIcon name="search" :size="18" />
        <input v-model="q" class="input" placeholder="Search products…" />
      </div>
      <select v-model="shopId" class="select">
        <option value="all">All shops</option>
        <option v-for="s in db.shops" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <select v-model="cat" class="select">
        <option value="all">All categories</option>
        <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
      </select>
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr><th>Product</th><th>Shop</th><th class="num">Price</th><th class="num">Stock</th><th class="num">Views</th><th>Visible</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id">
            <td>
              <div class="cell-main">
                <ProductImage :product="p" size="42px" icon-size="20px" round />
                <div><strong>{{ p.name }}</strong><small>{{ catById(p.category).label }} · {{ p.sku }}</small></div>
              </div>
            </td>
            <td class="small">{{ shopName(p.shopId) }}</td>
            <td class="num">{{ money(p.price, db.settings.currency) }}</td>
            <td class="num"><span :class="{ 'text-danger strong': p.stock <= 5 }">{{ p.stock }}</span></td>
            <td class="num muted">{{ p.views || 0 }}</td>
            <td>
              <label class="switch"><input type="checkbox" :checked="p.visible" @change="toggle(p, $event.target.checked)" /></label>
            </td>
            <td>
              <div class="actions">
                <button class="btn-icon sm danger" title="Remove listing" @click="remove(p)"><AppIcon name="trash" :size="17" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!filtered.length" icon="box" title="No products found" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ProductImage from '@/components/ProductImage.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { money } from '@/utils/format'
import { CATEGORIES, catById } from '@/data/categories'
import { toast } from '@/stores/toast'

const db = useDb()
const q = ref('')
const shopId = ref('all')
const cat = ref('all')
const shopName = (id) => db.shops.find((s) => s.id === id)?.name || '-'

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return db.products
    .filter((p) => shopId.value === 'all' || p.shopId === shopId.value)
    .filter((p) => cat.value === 'all' || p.category === cat.value)
    .filter((p) => !term || p.name.toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term))
})

function toggle(p, visible) {
  db.updateProduct(p.id, { visible })
  db.log('product', `Admin ${visible ? 'showed' : 'hid'} "${p.name}"`)
  toast(visible ? 'Product is visible to customers' : 'Product hidden from customers', 'info')
}
function remove(p) {
  if (!confirm(`Remove "${p.name}" from the platform?`)) return
  db.deleteProduct(p.id)
  toast('Product removed', 'info')
}
</script>
