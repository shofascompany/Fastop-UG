<template>
  <RouterLink :to="{ name: 'explore-shop', params: { id: shop.id } }" class="scard">
    <div class="scard-mark" :style="{ background: cat.color + '20' }"><AppIcon :name="cat.icon" :size="26" :style="{ color: cat.color }" /></div>
    <div class="scard-body">
      <strong class="truncate">{{ shop.name }}</strong>
      <span class="muted small truncate"><AppIcon name="pin" :size="13" /> {{ shop.address || 'Location on map' }}</span>
      <div class="row small scard-meta">
        <span class="badge">{{ cat.label }}</span>
        <span class="muted">{{ count }} products</span>
        <span v-if="distance" class="dist"><AppIcon name="navigation" :size="12" /> {{ distance }}</span>
      </div>
    </div>
    <AppIcon name="chevronRight" class="chev" />
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { catById } from '@/data/categories'
import { useDb } from '@/stores/db'
import { useGeo, fmtKm } from '@/composables/useGeo'

const props = defineProps({ shop: { type: Object, required: true } })
const db = useDb()
const { distanceTo } = useGeo()
const cat = computed(() => catById(props.shop.category))
const count = computed(() => db.publicProducts.filter((p) => p.shopId === props.shop.id).length)
const distance = computed(() => fmtKm(distanceTo(props.shop)))
</script>

<style scoped>
.scard {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  transition: 0.2s;
  min-width: 0;
}
.scard:hover {
  border-color: var(--brand-200);
  box-shadow: var(--shadow);
}
.scard-mark {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 26px;
  flex: none;
}
.scard-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.scard-meta {
  margin-top: 6px;
  flex-wrap: wrap;
  gap: 8px;
}
.dist {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  font-weight: 700;
}
.chev {
  color: var(--muted);
}
</style>
