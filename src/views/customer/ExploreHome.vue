<template>
  <div class="page">
    <!-- Hero search -->
    <section class="hero">
      <div class="hero-text">
        <span class="hello">{{ firstName ? `Hi ${firstName}` : 'Welcome' }}</span>
        <h1>Find what's in stock, in any shop</h1>
        <p>Browse products from every kind of shop, find them on the map, and visit or message the shop directly.</p>
        <form class="search" @submit.prevent="search">
          <AppIcon name="search" :size="20" />
          <input v-model="q" placeholder="Search products, e.g. sneakers, avocados…" />
          <button class="btn btn-accent">Search</button>
        </form>
      </div>
      <RouterLink :to="{ name: 'explore-map' }" class="hero-map">
        <div class="hm-grid"></div>
        <span v-for="(s, i) in db.publicShops.slice(0, 5)" :key="s.id" class="hm-pin" :style="pinPos(i)"><AppIcon :name="catById(s.category).icon" :size="16" :stroke="2.4" style="color: #fff; transform: rotate(45deg)" /></span>
        <span class="hm-cta"><AppIcon name="map" :size="16" /> Open the shop map</span>
      </RouterLink>
    </section>

    <!-- Categories -->
    <section>
      <div class="sec-head"><h2>Shop by category</h2></div>
      <div class="cats">
        <RouterLink v-for="c in cats" :key="c.id" :to="{ name: 'explore-products', query: { cat: c.id } }" class="cat" :style="{ '--c': c.color }">
          <span class="cat-e"><AppIcon :name="c.icon" :size="28" :style="{ color: c.color }" /></span>
          <span class="cat-l">{{ c.label }}</span>
          <small>{{ c.count }} items</small>
        </RouterLink>
      </div>
    </section>

    <!-- Featured -->
    <section v-if="featured.length">
      <div class="sec-head">
        <h2><AppIcon name="star" :size="20" class="star" /> Featured picks</h2>
        <RouterLink :to="{ name: 'explore-products' }" class="btn btn-ghost btn-sm">See all <AppIcon name="arrowRight" :size="15" /></RouterLink>
      </div>
      <div class="pgrid">
        <ProductCard v-for="p in featured" :key="p.id" :product="p" />
      </div>
    </section>

    <!-- Shops nearby -->
    <section>
      <div class="sec-head">
        <h2>{{ geo.location.value ? 'Shops nearest to you' : 'Popular shops' }}</h2>
        <button v-if="!geo.location.value" class="btn btn-soft btn-sm" @click="geo.locate()" :disabled="geo.status.value === 'loading'">
          <AppIcon name="locate" :size="16" /> {{ geo.status.value === 'loading' ? 'Locating…' : 'Use my location' }}
        </button>
      </div>
      <p v-if="geo.status.value === 'error'" class="alert warning">{{ geo.errorMsg.value }}</p>
      <div class="sgrid">
        <ShopCard v-for="s in nearby" :key="s.id" :shop="s" />
      </div>
    </section>

    <!-- New arrivals -->
    <section>
      <div class="sec-head">
        <h2>Just added</h2>
        <RouterLink :to="{ name: 'explore-products', query: { sort: 'new' } }" class="btn btn-ghost btn-sm">More <AppIcon name="arrowRight" :size="15" /></RouterLink>
      </div>
      <div class="pgrid">
        <ProductCard v-for="p in latest" :key="p.id" :product="p" />
      </div>
      <EmptyState v-if="!latest.length" icon="box" title="No products yet" text="Shops haven't listed anything yet. Check back soon." />
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import ProductCard from '@/components/ProductCard.vue'
import ShopCard from '@/components/ShopCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { useGeo } from '@/composables/useGeo'
import { CATEGORIES, catById } from '@/data/categories'

const db = useDb()
const auth = useAuth()
const router = useRouter()
const geo = useGeo()
const q = ref('')

const firstName = computed(() => auth.user?.name.split(' ')[0] || '')
const cats = computed(() =>
  CATEGORIES.map((c) => ({ ...c, count: db.publicProducts.filter((p) => p.category === c.id).length })).filter((c) => c.count > 0),
)
const featured = computed(() => db.publicProducts.filter((p) => p.featured).slice(0, 4))
const latest = computed(() => [...db.publicProducts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8))
const nearby = computed(() => {
  const list = db.publicShops.map((s) => ({ s, d: geo.distanceTo(s) }))
  if (geo.location.value) list.sort((a, b) => a.d - b.d)
  return list.slice(0, 4).map((x) => x.s)
})

const positions = [
  [22, 30],
  [62, 22],
  [44, 58],
  [78, 62],
  [30, 74],
]
const pinPos = (i) => ({ left: positions[i][0] + '%', top: positions[i][1] + '%' })

function search() {
  router.push({ name: 'explore-products', query: q.value.trim() ? { q: q.value.trim() } : {} })
}
</script>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 22px;
}
.hero-text {
  padding: 40px;
  border-radius: 24px;
  color: #14532d;
  background: radial-gradient(420px 260px at 100% 100%, rgba(94, 234, 212, 0.35), transparent 62%), linear-gradient(135deg, #86efac 0%, #bbf7d0 45%, #ffffff 100%);
  border: 1px solid rgba(34, 197, 94, 0.25);
  box-shadow: 0 18px 40px -24px rgba(22, 163, 74, 0.55);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hello {
  font-weight: 700;
  opacity: 0.9;
}
.hero-text h1 {
  font-size: clamp(28px, 3.6vw, 40px);
  font-weight: 800;
  letter-spacing: -0.03em;
}
.hero-text p {
  opacity: 0.92;
  max-width: 520px;
}
.search {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 16px;
  border-radius: 14px;
  background: var(--surface);
  color: var(--muted);
  box-shadow: var(--shadow);
}
.search input {
  flex: 1;
  border: none;
  outline: none;
  height: 44px;
  font-size: 15px;
  color: var(--text);
  min-width: 0;
  background: transparent;
}
.hero-map {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  min-height: 240px;
  background: linear-gradient(135deg, var(--map-land-a), var(--map-land-b) 60%, var(--map-land-c));
  border: 1px solid var(--border);
}
.hm-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(var(--map-road) 3px, transparent 3px), linear-gradient(90deg, var(--map-road) 3px, transparent 3px);
  background-size: 70px 70px;
  opacity: 0.9;
  transform: rotate(-8deg) scale(1.3);
}
.hm-pin {
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: var(--brand);
  border: 3px solid #fff;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow);
}
.hm-pin:nth-child(odd) {
  background: var(--accent);
}
.hm-cta {
  position: absolute;
  left: 16px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--surface);
  font-weight: 700;
  font-size: 14px;
  box-shadow: var(--shadow);
}
.hero-map:hover .hm-cta {
  color: var(--accent);
}
.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
}
.sec-head h2 {
  font-size: 21px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
}
.star {
  color: var(--accent);
  fill: var(--accent);
}
.cats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.cat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  transition: 0.2s;
}
.cat:hover {
  border-color: var(--c);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 15%, transparent);
}
.cat-e {
  font-size: 28px;
  margin-bottom: 6px;
}
.cat-l {
  font-weight: 700;
  font-size: 14px;
}
.cat small {
  color: var(--muted);
}
.pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}
.sgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
@media (max-width: 860px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .hero-text {
    padding: 28px 22px;
  }
  .hero-map {
    min-height: 180px;
  }
}
</style>
