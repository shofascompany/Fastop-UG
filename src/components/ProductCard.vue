<template>
  <article class="pcard">
    <RouterLink :to="{ name: 'explore-product', params: { id: product.id } }" class="pcard-media">
      <ProductImage :product="product" icon-size="56px" />
      <span v-if="product.featured" class="ribbon"><AppIcon name="star" :size="12" /> Featured</span>
    </RouterLink>
    <button class="fav" :class="{ on: isFav }" @click="toggle" :aria-label="isFav ? 'Remove from saved' : 'Save'">
      <AppIcon name="heart" :size="18" />
    </button>
    <div class="pcard-body">
      <span class="pcard-cat">{{ cat.label }}</span>
      <RouterLink :to="{ name: 'explore-product', params: { id: product.id } }" class="pcard-name">{{ product.name }}</RouterLink>
      <RouterLink v-if="shop" :to="{ name: 'explore-shop', params: { id: shop.id } }" class="pcard-shop">
        <AppIcon name="store" :size="14" /> <span class="truncate">{{ shop.name }}</span>
        <span v-if="distance" class="dist">· {{ distance }}</span>
      </RouterLink>
      <span class="avail" :class="product.stock > 0 ? 'in' : 'out'">
        <span class="dot"></span>{{ product.stock > 0 ? 'Available in store' : 'Currently out of stock' }}
      </span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import ProductImage from './ProductImage.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { catById } from '@/data/categories'
import { useGeo, fmtKm } from '@/composables/useGeo'
import { toast } from '@/stores/toast'

const props = defineProps({ product: { type: Object, required: true } })
const db = useDb()
const auth = useAuth()
const { distanceTo } = useGeo()
const router = useRouter()
const route = useRoute()

const shop = computed(() => db.shops.find((s) => s.id === props.product.shopId))
const cat = computed(() => catById(props.product.category))
const isFav = computed(() => auth.user?.favorites?.includes(props.product.id))
const distance = computed(() => fmtKm(distanceTo(shop.value)))

function toggle() {
  if (!auth.user) {
    toast('Sign in to save products', 'info')
    router.push({ name: 'auth', query: { role: 'customer', redirect: route.fullPath } })
    return
  }
  db.toggleFavorite(auth.user.id, props.product.id)
  toast(isFav.value ? 'Saved to your list' : 'Removed from saved', 'info')
}
</script>

<style scoped>
.pcard {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}
.pcard:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.pcard-media {
  position: relative;
  padding: 10px;
}
.pcard-media :deep(.pimg) {
  border-radius: 14px;
}
.ribbon {
  position: absolute;
  top: 18px;
  left: 18px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 99px;
  background: var(--grad-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.fav {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--glass);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  color: var(--muted);
  box-shadow: var(--shadow-sm);
  transition: 0.15s;
}
.fav:hover {
  color: var(--fav);
}
.fav.on {
  color: var(--fav);
}
.fav.on :deep(path) {
  fill: currentColor;
}
.pcard-body {
  padding: 4px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pcard-cat {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}
.pcard-name {
  font-weight: 700;
  font-size: 15.5px;
  line-height: 1.3;
}
.pcard-name:hover {
  color: var(--brand);
}
.pcard-shop {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--text-2);
  min-width: 0;
}
.pcard-shop:hover {
  color: var(--brand);
}
.dist {
  color: var(--muted);
  flex: none;
}
.avail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
}
.avail .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.avail.in {
  color: var(--success);
}
.avail.out {
  color: var(--muted);
}
</style>
