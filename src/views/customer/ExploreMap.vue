<template>
  <div class="mapx">
    <aside class="panel card">
      <div class="panel-head">
        <h1>Shop map</h1>
        <p class="muted small">{{ shops.length }} shops {{ geo.location.value ? 'sorted by distance' : 'on the map' }}</p>
        <div class="input-icon">
          <AppIcon name="search" :size="18" />
          <input v-model="q" class="input" placeholder="Search shops or products…" />
        </div>
        <div class="chips scroll">
          <button class="chip" :class="{ active: cat === 'all' }" @click="cat = 'all'">All</button>
          <button v-for="c in usedCats" :key="c.id" class="chip" :class="{ active: cat === c.id }" @click="cat = c.id">{{ c.label }}</button>
        </div>
        <button class="btn btn-soft btn-block" @click="locateMe" :disabled="geo.status.value === 'loading'">
          <AppIcon name="locate" :size="17" /> {{ geo.status.value === 'loading' ? 'Finding you…' : geo.location.value ? 'Re-centre on me' : 'Find shops near me' }}
        </button>
        <p v-if="geo.status.value === 'error'" class="alert warning small">{{ geo.errorMsg.value }}</p>
      </div>
      <ul class="list-plain shop-list">
        <li v-for="s in shops" :key="s.id" :class="{ active: s.id === selected }" @click="select(s.id)">
          <span class="mk" :style="{ background: catById(s.category).color }"><i><AppIcon :name="catById(s.category).icon" :size="16" :stroke="2.4" style="color: #fff" /></i></span>
          <div class="grow">
            <strong class="truncate">{{ s.name }}</strong>
            <small class="muted truncate">{{ s.address || catById(s.category).label }}</small>
          </div>
          <span v-if="s.dist != null" class="dist">{{ fmtKm(s.dist) }}</span>
        </li>
        <li v-if="!shops.length" class="none muted small">No shops match your filters.</li>
      </ul>
    </aside>

    <MapView ref="mapRef" class="map" height="100%" :markers="markers" :selected-id="selected" :user-location="geo.location.value" @select="select">
      <Transition name="pop">
        <div v-if="current" class="sel-card card">
          <button class="btn-icon sm close" @click="selected = null"><AppIcon name="x" :size="16" /></button>
          <div class="row">
            <span class="sel-mark" :style="{ background: catById(current.category).color + '22' }"><AppIcon :name="catById(current.category).icon" :size="24" :style="{ color: catById(current.category).color }" /></span>
            <div class="grow">
              <strong>{{ current.name }}</strong>
              <div class="muted small">{{ current.address }} <span v-if="current.dist != null">· {{ fmtKm(current.dist) }}</span></div>
            </div>
          </div>
          <div class="previews">
            <RouterLink v-for="p in currentProducts" :key="p.id" :to="{ name: 'explore-product', params: { id: p.id } }" class="prev" :title="p.name">
              <ProductImage :product="p" size="56px" icon-size="24px" round />
            </RouterLink>
          </div>
          <div class="row wrap">
            <RouterLink :to="{ name: 'explore-shop', params: { id: current.id } }" class="btn btn-primary btn-sm">View shop</RouterLink>
            <a :href="directionsUrl(current)" target="_blank" rel="noopener" class="btn btn-outline btn-sm"><AppIcon name="navigation" :size="15" /> Directions</a>
            <a v-if="current.phone" :href="`tel:${current.phone}`" class="btn btn-ghost btn-sm"><AppIcon name="phone" :size="15" /> Call</a>
          </div>
        </div>
      </Transition>
    </MapView>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import MapView from '@/components/MapView.vue'
import ProductImage from '@/components/ProductImage.vue'
import { useDb } from '@/stores/db'
import { useGeo, fmtKm, directionsUrl } from '@/composables/useGeo'
import { CATEGORIES, catById } from '@/data/categories'

const db = useDb()
const geo = useGeo()
const q = ref('')
const cat = ref('all')
const selected = ref(null)
const mapRef = ref(null)

const usedCats = computed(() => CATEGORIES.filter((c) => db.publicShops.some((s) => s.category === c.id)))

const shops = computed(() => {
  const term = q.value.trim().toLowerCase()
  const items = db.publicShops
    .filter((s) => cat.value === 'all' || s.category === cat.value)
    .filter(
      (s) =>
        !term ||
        s.name.toLowerCase().includes(term) ||
        db.publicProducts.some((p) => p.shopId === s.id && p.name.toLowerCase().includes(term)),
    )
    .map((s) => ({ ...s, dist: geo.distanceTo(s) }))
  return geo.location.value ? items.sort((a, b) => a.dist - b.dist) : items
})

const markers = computed(() =>
  shops.value.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, color: catById(s.category).color, icon: catById(s.category).icon, title: s.name })),
)
const current = computed(() => shops.value.find((s) => s.id === selected.value))
const currentProducts = computed(() => (current.value ? db.publicProducts.filter((p) => p.shopId === current.value.id).slice(0, 5) : []))

function select(id) {
  selected.value = id
  const s = shops.value.find((x) => x.id === id)
  if (s) mapRef.value?.flyTo([s.lat, s.lng], 16)
}
async function locateMe() {
  const loc = await geo.locate()
  if (loc) mapRef.value?.flyTo([loc.lat, loc.lng], 14)
}
</script>

<style scoped>
.mapx {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
  height: calc(100vh - 68px - 56px);
  min-height: 520px;
}
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-head {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid var(--border);
}
.panel-head h1 {
  font-size: 22px;
  font-weight: 800;
}
.panel-head p {
  margin-top: -8px;
}
.shop-list {
  overflow-y: auto;
  flex: 1;
}
.shop-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.shop-list li:hover {
  background: var(--surface-2);
}
.shop-list li.active {
  background: var(--accent-50);
}
.shop-list li.none {
  cursor: default;
}
.mk {
  width: 36px;
  height: 36px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: grid;
  place-items: center;
  border: 2px solid #fff;
  box-shadow: var(--shadow-sm);
  flex: none;
  font-size: 15px;
}
.mk i {
  transform: rotate(45deg);
  font-style: normal;
}
.grow {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.dist {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  flex: none;
}
.map {
  min-height: 420px;
}
.sel-card {
  position: absolute;
  z-index: 1000;
  left: 16px;
  right: 16px;
  bottom: 16px;
  max-width: 420px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-lg);
}
.close {
  position: absolute;
  top: 8px;
  right: 8px;
}
.sel-mark {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 24px;
  flex: none;
}
.previews {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}
.prev {
  flex: none;
  border-radius: 10px;
  transition: transform 0.15s;
}
.prev:hover {
  transform: translateY(-2px);
}
.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
@media (max-width: 900px) {
  .mapx {
    grid-template-columns: 1fr;
    grid-template-rows: 60vh auto;
    height: auto;
  }
  .map {
    order: -1;
    height: 60vh !important;
  }
  .shop-list {
    max-height: 360px;
  }
}
</style>
