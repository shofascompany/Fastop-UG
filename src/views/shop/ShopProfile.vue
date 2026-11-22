<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Shop profile</h1>
        <p>This is what customers see on your public page and the map.</p>
      </div>
      <RouterLink v-if="shop.status === 'active'" :to="{ name: 'explore-shop', params: { id: shop.id } }" class="btn btn-outline"><AppIcon name="eye" :size="18" /> Preview public page</RouterLink>
    </div>

    <form class="grid grid-2" @submit.prevent="save">
      <div class="card">
        <div class="card-head"><h3>Business details</h3></div>
        <div class="card-body form-grid">
          <div class="field span-2"><label>Shop name *</label><input v-model="form.name" class="input" required /></div>
          <div class="field">
            <label>Main category</label>
            <select v-model="form.category" class="select">
              <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </div>
          <div class="field"><label>Opening hours</label><input v-model="form.hours" class="input" placeholder="Mon to Sat, 8am-6pm" /></div>
          <div class="field"><label>Phone</label><input v-model="form.phone" class="input" type="tel" placeholder="+1 555 000 000" /></div>
          <div class="field"><label>Email</label><input v-model="form.email" class="input" type="email" /></div>
          <div class="field span-2"><label>Street address</label><input v-model="form.address" class="input" placeholder="Building, street, area" /></div>
          <div class="field span-2"><label>About the shop</label><textarea v-model="form.description" class="textarea" placeholder="Tell customers what you sell and why they should visit."></textarea></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Location on map</h3>
          <button type="button" class="btn btn-soft btn-sm" @click="useMine" :disabled="geo.status.value === 'loading'">
            <AppIcon name="locate" :size="16" /> {{ geo.status.value === 'loading' ? 'Locating…' : 'Use my location' }}
          </button>
        </div>
        <div class="card-body stack">
          <MapView ref="mapRef" height="360px" pickable :picked="{ lat: form.lat, lng: form.lng }" :zoom="15" @pick="setPoint" />
          <p class="hint"><AppIcon name="info" :size="14" /> Click the map or drag the orange pin to your shop's exact entrance.</p>
          <div class="row">
            <div class="field grow"><label>Latitude</label><input v-model.number="form.lat" class="input" type="number" step="any" /></div>
            <div class="field grow"><label>Longitude</label><input v-model.number="form.lng" class="input" type="number" step="any" /></div>
          </div>
          <p v-if="geo.status.value === 'error'" class="alert warning">{{ geo.errorMsg.value }}</p>
        </div>
      </div>

      <div class="span-all row save-row">
        <button class="btn btn-primary btn-lg" type="submit"><AppIcon name="check" :size="18" /> Save profile</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import MapView from '@/components/MapView.vue'
import { useDb } from '@/stores/db'
import { useCurrentShop } from '@/composables/useCurrentShop'
import { useGeo } from '@/composables/useGeo'
import { CATEGORIES } from '@/data/categories'
import { toast } from '@/stores/toast'

const db = useDb()
const shop = useCurrentShop()
const geo = useGeo()
const mapRef = ref(null)

const fields = ['name', 'category', 'hours', 'phone', 'email', 'address', 'description', 'lat', 'lng']
const form = reactive({})
const load = () => fields.forEach((f) => (form[f] = shop.value[f] ?? ''))
load()
// Reload when an admin switches the shop they are managing
watch(() => shop.value.id, load)

function setPoint({ lat, lng }) {
  form.lat = +lat.toFixed(6)
  form.lng = +lng.toFixed(6)
}
async function useMine() {
  const loc = await geo.locate()
  if (loc) {
    setPoint(loc)
    mapRef.value?.flyTo([loc.lat, loc.lng], 16)
  }
}
function save() {
  const patch = {}
  fields.forEach((f) => (patch[f] = typeof form[f] === 'string' ? form[f].trim() : form[f]))
  patch.lat = Number(patch.lat) || 0
  patch.lng = Number(patch.lng) || 0
  db.updateShop(shop.value.id, patch)
  toast('Shop profile saved')
}
</script>

<style scoped>
.grow {
  flex: 1;
}
.span-all {
  grid-column: 1 / -1;
}
.save-row {
  justify-content: flex-end;
}
.hint {
  display: flex;
  align-items: center;
  gap: 6px;
}
@media (max-width: 1100px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
