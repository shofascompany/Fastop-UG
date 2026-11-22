<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>{{ activeCat ? activeCat.label : 'All products' }}</h1>
        <p>{{ list.length }} products in stock across all shops</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="input-icon">
        <AppIcon name="search" :size="18" />
        <input v-model="q" class="input" placeholder="Search products…" />
      </div>
      <select v-model="shopId" class="select">
        <option value="all">All shops</option>
        <option v-for="s in db.publicShops" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <select v-model="sort" class="select">
        <option value="popular">Most popular</option>
        <option value="new">Newest</option>
        <option value="az">Name (A to Z)</option>
        <option value="near">Nearest to me</option>
      </select>
      <label class="switch"><input v-model="inStock" type="checkbox" /> In stock only</label>
    </div>

    <div class="chips scroll">
      <button class="chip" :class="{ active: cat === 'all' }" @click="cat = 'all'">All</button>
      <button v-for="c in CATEGORIES" :key="c.id" class="chip" :class="{ active: cat === c.id }" @click="cat = c.id">{{ c.label }}</button>
    </div>

    <div v-if="list.length" class="pgrid">
      <ProductCard v-for="p in list" :key="p.id" :product="p" />
    </div>
    <div v-else class="card">
      <EmptyState icon="search" title="No products match" text="Try another search term or category.">
        <button class="btn btn-outline" @click="reset">Clear filters</button>
      </EmptyState>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useGeo } from '@/composables/useGeo'
import { CATEGORIES, catById } from '@/data/categories'

const db = useDb()
const route = useRoute()
const router = useRouter()
const geo = useGeo()

const q = ref(route.query.q || '')
const cat = ref(route.query.cat || 'all')
const sort = ref(route.query.sort || 'popular')
const shopId = ref('all')
const inStock = ref(false)

const activeCat = computed(() => (cat.value === 'all' ? null : catById(cat.value)))

watch(sort, async (v) => {
  if (v === 'near' && !geo.location.value) {
    const loc = await geo.locate()
    if (!loc) sort.value = 'popular'
  }
})

// Keep the URL in sync so results can be shared / bookmarked
watch([q, cat, sort], () => {
  const query = {}
  if (q.value) query.q = q.value
  if (cat.value !== 'all') query.cat = cat.value
  if (sort.value !== 'popular') query.sort = sort.value
  router.replace({ query })
})
watch(
  () => route.query,
  (qq) => {
    if (qq.cat && qq.cat !== cat.value) cat.value = qq.cat
    if (qq.q !== undefined && qq.q !== q.value) q.value = qq.q
  },
)

const shopById = (id) => db.shops.find((s) => s.id === id)
const list = computed(() => {
  const term = q.value.trim().toLowerCase()
  let items = db.publicProducts
    .filter((p) => cat.value === 'all' || p.category === cat.value)
    .filter((p) => shopId.value === 'all' || p.shopId === shopId.value)
    .filter((p) => !inStock.value || p.stock > 0)
    .filter((p) => !term || p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term) || shopById(p.shopId)?.name.toLowerCase().includes(term))
  items = [...items]
  if (sort.value === 'new') items.sort((a, b) => b.createdAt - a.createdAt)
  else if (sort.value === 'az') items.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'near' && geo.location.value) items.sort((a, b) => geo.distanceTo(shopById(a.shopId)) - geo.distanceTo(shopById(b.shopId)))
  else items.sort((a, b) => (b.featured - a.featured) || (b.views || 0) - (a.views || 0))
  return items
})

function reset() {
  q.value = ''
  cat.value = 'all'
  shopId.value = 'all'
  inStock.value = false
}
</script>

<style scoped>
.pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}
</style>
