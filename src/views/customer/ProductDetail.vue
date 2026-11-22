<template>
  <div v-if="product && shop" class="page">
    <RouterLink :to="{ name: 'explore-products' }" class="back"><AppIcon name="arrowLeft" :size="16" /> All products</RouterLink>

    <div class="detail">
      <div class="media card">
        <ProductImage :product="product" icon-size="140px" />
        <span v-if="product.featured" class="ribbon"><AppIcon name="star" :size="13" /> Featured</span>
      </div>

      <div class="info">
        <span class="badge" :style="{ background: cat.color + '1a', color: cat.color }">{{ cat.label }}</span>
        <h1>{{ product.name }}</h1>
        <span class="avail" :class="product.stock > 0 ? 'in' : 'out'">
          <span class="dot"></span>{{ product.stock > 0 ? 'Available in store' : 'Out of stock right now. Ask the shop when it\'s back' }}
        </span>
        <p class="desc">{{ product.description || 'The shop hasn\'t added a description yet. Ask them for details.' }}</p>

        <div class="no-price">
          <AppIcon name="tag" :size="18" />
          <span>The shop gives you the price. Ask here, call them, or drop in.</span>
        </div>

        <div class="cta">
          <button class="btn btn-accent btn-lg" @click="openEnquiry"><AppIcon name="message" :size="18" /> Ask the shop</button>
          <button class="btn btn-outline btn-lg" :class="{ fav: isFav }" @click="toggleFav"><AppIcon name="heart" :size="18" /> {{ isFav ? 'Saved' : 'Save' }}</button>
        </div>

        <div class="shop-box card">
          <div class="row">
            <div class="smark" :style="{ background: shopCat.color + '20' }"><AppIcon :name="shopCat.icon" :size="24" :style="{ color: shopCat.color }" /></div>
            <div class="grow">
              <RouterLink :to="{ name: 'explore-shop', params: { id: shop.id } }" class="strong">{{ shop.name }}</RouterLink>
              <div class="muted small"><AppIcon name="pin" :size="13" /> {{ shop.address || 'See map' }} <span v-if="dist">· {{ dist }} away</span></div>
              <div class="muted small"><AppIcon name="clock" :size="13" /> {{ shop.hours }}</div>
            </div>
          </div>
          <div class="row wrap">
            <a v-if="shop.phone" :href="`tel:${shop.phone}`" class="btn btn-soft btn-sm"><AppIcon name="phone" :size="15" /> Call</a>
            <a :href="directionsUrl(shop)" target="_blank" rel="noopener" class="btn btn-soft btn-sm"><AppIcon name="navigation" :size="15" /> Directions</a>
            <RouterLink :to="{ name: 'explore-shop', params: { id: shop.id } }" class="btn btn-ghost btn-sm">Visit shop page <AppIcon name="arrowRight" :size="15" /></RouterLink>
          </div>
        </div>
      </div>
    </div>

    <section>
      <h2 class="sec-title">Find it here</h2>
      <MapView :markers="[{ id: shop.id, lat: shop.lat, lng: shop.lng, color: shopCat.color, icon: shopCat.icon, title: shop.name }]" :user-location="geo.location.value" height="300px" :zoom="15" />
    </section>

    <section v-if="more.length">
      <h2 class="sec-title">More from {{ shop.name }}</h2>
      <div class="pgrid"><ProductCard v-for="p in more" :key="p.id" :product="p" /></div>
    </section>

    <BaseModal :open="enquire" :title="`Ask ${shop.name}`" width="480px" @close="enquire = false">
      <form id="enqForm" class="stack" @submit.prevent="send">
        <div class="enq-about">
          <ProductImage :product="product" size="48px" icon-size="22px" round />
          <div><strong>{{ product.name }}</strong><br /><small class="muted">{{ shop.name }}</small></div>
        </div>
        <div class="field">
          <label>Your message</label>
          <textarea v-model="message" class="textarea" required placeholder="Hi! Is this available? What's the price? Can I reserve one?"></textarea>
        </div>
        <div class="chips">
          <button v-for="s in suggestions" :key="s" type="button" class="chip" @click="message = s">{{ s }}</button>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-outline" @click="enquire = false">Cancel</button>
        <button class="btn btn-accent" type="submit" form="enqForm" :disabled="!message.trim()"><AppIcon name="send" :size="16" /> Send enquiry</button>
      </template>
    </BaseModal>
  </div>

  <div v-else class="card"><EmptyState icon="box" title="This product isn't listed any more" text="The shop may have sold out or taken it down.">
    <RouterLink :to="{ name: 'explore-products' }" class="btn btn-primary">Browse products</RouterLink>
  </EmptyState></div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import ProductImage from '@/components/ProductImage.vue'
import ProductCard from '@/components/ProductCard.vue'
import MapView from '@/components/MapView.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { useGeo, fmtKm, directionsUrl } from '@/composables/useGeo'
import { catById } from '@/data/categories'
import { toast } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const db = useDb()
const auth = useAuth()
const geo = useGeo()

const product = computed(() => db.publicProducts.find((p) => p.id === route.params.id))
const shop = computed(() => product.value && db.shops.find((s) => s.id === product.value.shopId))
const cat = computed(() => catById(product.value?.category))
const shopCat = computed(() => catById(shop.value?.category))
const dist = computed(() => fmtKm(geo.distanceTo(shop.value)))
const more = computed(() => (product.value ? db.publicProducts.filter((p) => p.shopId === product.value.shopId && p.id !== product.value.id).slice(0, 4) : []))
const isFav = computed(() => auth.user?.favorites?.includes(product.value?.id))

// Count a view each time a shopper (signed in or not) opens a product
watch(
  () => route.params.id,
  (id) => {
    if (id && (!auth.user || auth.user.role === 'customer')) db.viewProduct(id)
  },
  { immediate: true },
)

function needSignIn(msg) {
  if (auth.user) return false
  toast(msg, 'info')
  router.push({ name: 'auth', query: { role: 'customer', redirect: route.fullPath } })
  return true
}

function openEnquiry() {
  if (!needSignIn('Sign in to message the shop')) enquire.value = true
}

function toggleFav() {
  if (needSignIn('Sign in to save products')) return
  db.toggleFavorite(auth.user.id, product.value.id)
  toast(isFav.value ? 'Saved to your list' : 'Removed from saved', 'info')
}

const enquire = ref(false)
const message = ref('')
const suggestions = ['Is this still available?', 'What is the price?', 'Can you reserve one for me?']
function send() {
  db.addEnquiry({ shopId: shop.value.id, productId: product.value.id, customerId: auth.user.id, message: message.value.trim() })
  toast('Sent. The shop\'s reply will show up in your enquiries')
  enquire.value = false
  message.value = ''
}
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
.back:hover {
  color: var(--text);
}
.detail {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 36px;
  align-items: start;
}
.media {
  position: relative;
  padding: 14px;
  border-radius: 24px;
}
.media :deep(.pimg) {
  border-radius: 18px;
}
.ribbon {
  position: absolute;
  top: 28px;
  left: 28px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 99px;
  background: var(--grad-accent);
  color: #fff;
  font-weight: 700;
  font-size: 12px;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
}
.info h1 {
  font-size: clamp(28px, 3.4vw, 38px);
  font-weight: 800;
  letter-spacing: -0.03em;
}
.avail {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
}
.avail .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.avail.in {
  color: var(--success);
}
.avail.out {
  color: var(--muted);
}
.desc {
  font-size: 16px;
  color: var(--text-2);
}
.no-price {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--accent-50);
  color: var(--accent-700);
  font-size: 14px;
  font-weight: 500;
}
.cta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.fav {
  color: var(--fav);
  border-color: color-mix(in srgb, var(--fav) 35%, transparent);
}
.fav :deep(path) {
  fill: currentColor;
}
.shop-box {
  width: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.smark {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 24px;
  flex: none;
}
.grow {
  flex: 1;
  min-width: 0;
}
.sec-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 14px;
}
.pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}
.enq-about {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  background: var(--surface-2);
}
@media (max-width: 860px) {
  .detail {
    grid-template-columns: 1fr;
  }
}
</style>
