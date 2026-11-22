<template>
  <div v-if="shop" class="page">
    <RouterLink :to="{ name: 'explore-shops' }" class="back"><AppIcon name="arrowLeft" :size="16" /> All shops</RouterLink>

    <section class="banner" :style="{ '--c': cat.color }">
      <div class="b-mark"><AppIcon :name="cat.icon" :size="44" :stroke="1.8" :style="{ color: cat.color }" /></div>
      <div class="b-info">
        <span class="badge">{{ cat.label }}</span>
        <h1>{{ shop.name }}</h1>
        <p>{{ shop.description || 'A shop on Fastop.' }}</p>
        <div class="b-meta">
          <span><AppIcon name="pin" :size="15" /> {{ shop.address || 'See map' }}</span>
          <span><AppIcon name="clock" :size="15" /> {{ shop.hours }}</span>
          <span v-if="dist"><AppIcon name="navigation" :size="15" /> {{ dist }} away</span>
        </div>
      </div>
      <div class="b-actions">
        <a v-if="shop.phone" :href="`tel:${shop.phone}`" class="btn btn-dark"><AppIcon name="phone" :size="17" /> {{ shop.phone }}</a>
        <a :href="directionsUrl(shop)" target="_blank" rel="noopener" class="btn btn-accent"><AppIcon name="navigation" :size="17" /> Get directions</a>
        <a v-if="shop.email" :href="`mailto:${shop.email}`" class="btn btn-outline"><AppIcon name="mail" :size="17" /> Email</a>
      </div>
    </section>

    <div class="grid layout">
      <section>
        <div class="row between sec">
          <h2>Products <span class="muted">({{ products.length }})</span></h2>
          <div class="chips">
            <button class="chip" :class="{ active: catFilter === 'all' }" @click="catFilter = 'all'">All</button>
            <button v-for="c in usedCats" :key="c.id" class="chip" :class="{ active: catFilter === c.id }" @click="catFilter = c.id">{{ c.label }}</button>
          </div>
        </div>
        <div v-if="filtered.length" class="pgrid"><ProductCard v-for="p in filtered" :key="p.id" :product="p" /></div>
        <div v-else class="card"><EmptyState icon="box" title="No products listed yet" /></div>
      </section>
      <aside class="side">
        <MapView
          :markers="[{ id: shop.id, lat: shop.lat, lng: shop.lng, color: cat.color, icon: cat.icon, title: shop.name }]"
          :user-location="geo.location.value"
          height="320px"
          :zoom="16"
        />
        <button v-if="!geo.location.value" class="btn btn-soft btn-block" @click="geo.locate()"><AppIcon name="locate" :size="17" /> Show distance from me</button>
      </aside>
    </div>
  </div>
  <div v-else class="card">
    <EmptyState icon="store" title="This shop isn't on Fastop right now" text="Have a look at the other shops on Fastop.">
      <RouterLink :to="{ name: 'explore-shops' }" class="btn btn-primary">Browse shops</RouterLink>
    </EmptyState>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import ProductCard from '@/components/ProductCard.vue'
import MapView from '@/components/MapView.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useGeo, fmtKm, directionsUrl } from '@/composables/useGeo'
import { CATEGORIES, catById } from '@/data/categories'

const route = useRoute()
const db = useDb()
const geo = useGeo()
const catFilter = ref('all')

const shop = computed(() => db.publicShops.find((s) => s.id === route.params.id))
const cat = computed(() => catById(shop.value?.category))
const dist = computed(() => fmtKm(geo.distanceTo(shop.value)))
const products = computed(() => db.publicProducts.filter((p) => p.shopId === shop.value?.id))
const usedCats = computed(() => CATEGORIES.filter((c) => products.value.some((p) => p.category === c.id)))
const filtered = computed(() => products.value.filter((p) => catFilter.value === 'all' || p.category === catFilter.value))
</script>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--muted);
  align-self: flex-start;
}
.banner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 24px;
  align-items: center;
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--c) 16%, var(--surface)), var(--surface) 70%);
  border: 1px solid var(--border);
}
.b-mark {
  width: 96px;
  height: 96px;
  border-radius: 26px;
  display: grid;
  place-items: center;
  font-size: 48px;
  background: var(--surface);
  box-shadow: var(--shadow);
}
.b-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  min-width: 0;
}
.b-info h1 {
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 800;
}
.b-info p {
  color: var(--text-2);
}
.b-meta {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  color: var(--text-2);
  font-size: 14px;
}
.b-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.b-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.layout {
  grid-template-columns: minmax(0, 1fr) 340px;
  align-items: start;
}
.sec {
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.sec h2 {
  font-size: 20px;
  font-weight: 800;
}
.pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}
.side {
  position: sticky;
  top: 90px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
@media (max-width: 1000px) {
  .banner {
    grid-template-columns: 1fr;
  }
  .b-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .layout {
    grid-template-columns: 1fr;
  }
  .side {
    position: static;
    order: -1;
  }
}
</style>
