<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Shops</h1>
        <p>{{ list.length }} shops on Fastop</p>
      </div>
      <div class="row">
        <button class="btn btn-soft" @click="geo.locate()" :disabled="geo.status.value === 'loading'">
          <AppIcon name="locate" :size="17" /> {{ geo.location.value ? 'Update location' : geo.status.value === 'loading' ? 'Locating…' : 'Sort by distance' }}
        </button>
        <RouterLink :to="{ name: 'explore-map' }" class="btn btn-primary"><AppIcon name="map" :size="17" /> Map view</RouterLink>
      </div>
    </div>

    <div class="toolbar">
      <div class="input-icon">
        <AppIcon name="search" :size="18" />
        <input v-model="q" class="input" placeholder="Search shops…" />
      </div>
      <select v-model="cat" class="select">
        <option value="all">All categories</option>
        <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
      </select>
    </div>
    <p v-if="geo.status.value === 'error'" class="alert warning">{{ geo.errorMsg.value }}</p>

    <div v-if="list.length" class="sgrid">
      <ShopCard v-for="s in list" :key="s.id" :shop="s" />
    </div>
    <div v-else class="card"><EmptyState icon="store" title="No shops found" /></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ShopCard from '@/components/ShopCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useGeo } from '@/composables/useGeo'
import { CATEGORIES } from '@/data/categories'

const db = useDb()
const geo = useGeo()
const q = ref('')
const cat = ref('all')

const list = computed(() => {
  const term = q.value.trim().toLowerCase()
  const items = db.publicShops
    .filter((s) => cat.value === 'all' || s.category === cat.value)
    .filter((s) => !term || s.name.toLowerCase().includes(term) || (s.address || '').toLowerCase().includes(term) || (s.description || '').toLowerCase().includes(term))
  return geo.location.value ? [...items].sort((a, b) => geo.distanceTo(a) - geo.distanceTo(b)) : items
})
</script>

<style scoped>
.sgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
</style>
