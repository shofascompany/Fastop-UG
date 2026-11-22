<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Shops</h1>
        <p>Register shops, suspend bad actors and step into any shop's manager.</p>
      </div>
      <button class="btn btn-primary" @click="openRegister"><AppIcon name="plus" :size="18" /> Register a shop</button>
    </div>

    <!-- Register a shop: the owner finishes their own login on first sign-in -->
    <BaseModal :open="registering" title="Register a shop" width="640px" @close="registering = false">
      <form id="regForm" class="stack" @submit.prevent="register">
        <p class="muted small">
          The owner signs in with the email or phone below. Fastop emails them a code, then they choose their own username and password.
        </p>
        <h4 class="sec">Shop</h4>
        <div class="form-grid">
          <div class="field span-2"><label>Shop name *</label><input v-model="form.shopName" class="input" required placeholder="e.g. Mama Rose Fresh Produce" /></div>
          <div class="field">
            <label>Category</label>
            <select v-model="form.category" class="select">
              <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </div>
          <div class="field"><label>Opening hours</label><input v-model="form.hours" class="input" placeholder="Mon to Sat, 8am-6pm" /></div>
          <div class="field span-2"><label>Address</label><input v-model="form.address" class="input" placeholder="Street, area, town" /></div>
          <div class="field span-2"><label>Description</label><textarea v-model="form.description" class="textarea" placeholder="What the shop sells" /></div>
        </div>
        <div class="field">
          <label>Location <span class="muted small">(click the map to drop the pin)</span></label>
          <MapView pickable :picked="form.pin" height="220px" :zoom="14" @pick="form.pin = $event" />
        </div>
        <h4 class="sec">Owner</h4>
        <div class="form-grid">
          <div class="field"><label>Owner's name</label><input v-model="form.ownerName" class="input" placeholder="Full name" /></div>
          <div class="field"><label>Phone</label><input v-model="form.phone" class="input" inputmode="tel" placeholder="0726 128 782" /></div>
          <div class="field span-2">
            <label>Email *</label><input v-model="form.email" class="input" type="email" required placeholder="owner@gmail.com" />
            <span class="hint">Their sign-in code is sent here.</span>
          </div>
        </div>
        <div v-if="regError" class="alert danger"><AppIcon name="alert" :size="18" /> {{ regError }}</div>
      </form>
      <template #footer>
        <button class="btn btn-outline" @click="registering = false">Cancel</button>
        <button class="btn btn-primary" type="submit" form="regForm" :disabled="saving">{{ saving ? 'Registering…' : 'Register shop' }}</button>
      </template>
    </BaseModal>

    <MapView :markers="markers" height="320px" :selected-id="selected" @select="selected = $event" />

    <div class="toolbar">
      <div class="input-icon">
        <AppIcon name="search" :size="18" />
        <input v-model="q" class="input" placeholder="Search shops or owners…" />
      </div>
      <div class="chips">
        <button v-for="f in filters" :key="f.id" class="chip" :class="{ active: status === f.id }" @click="status = f.id">
          {{ f.label }} <span class="muted">{{ f.count }}</span>
        </button>
      </div>
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr><th>Shop</th><th>Owner</th><th class="num">Products</th><th class="num">Revenue</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id" :class="{ sel: s.id === selected }" @click="selected = s.id">
            <td>
              <div class="cell-main">
                <span class="mark" :style="{ background: catById(s.category).color + '20' }"><AppIcon :name="catById(s.category).icon" :size="20" :style="{ color: catById(s.category).color }" /></span>
                <div><strong>{{ s.name }}</strong><small>{{ s.address || 'No address' }}</small></div>
              </div>
            </td>
            <td class="small">{{ owner(s)?.name }}<br /><span class="muted">{{ owner(s)?.email }}</span></td>
            <td class="num">{{ s.productCount }}</td>
            <td class="num strong">{{ money(s.revenue, db.settings.currency) }}</td>
            <td>
              <select class="select status-select" :class="s.status" :value="s.status" @click.stop @change="setStatus(s, $event.target.value)">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </td>
            <td>
              <div class="actions">
                <button class="btn btn-soft btn-sm" @click.stop="manage(s)"><AppIcon name="store" :size="15" /> Manage</button>
                <RouterLink v-if="s.status === 'active'" :to="{ name: 'explore-shop', params: { id: s.id } }" class="btn-icon sm" title="Public page" @click.stop>
                  <AppIcon name="eye" :size="17" />
                </RouterLink>
                <button class="btn-icon sm danger" title="Delete shop" @click.stop="remove(s)"><AppIcon name="trash" :size="17" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!filtered.length" icon="store" title="No shops found" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import MapView from '@/components/MapView.vue'
import EmptyState from '@/components/EmptyState.vue'
import BaseModal from '@/components/BaseModal.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { money, sum, escapeHtml } from '@/utils/format'
import { CATEGORIES, catById } from '@/data/categories'
import { toast } from '@/stores/toast'
import { api } from '@/services/api'

const db = useDb()
const auth = useAuth()
const router = useRouter()
const q = ref('')
const status = ref('all')
const selected = ref(null)

const owner = (s) => db.users.find((u) => u.id === s.ownerId)
const count = (st) => db.shops.filter((s) => s.status === st).length
const filters = computed(() => [
  { id: 'all', label: 'All', count: db.shops.length },
  { id: 'active', label: 'Active', count: count('active') },
  { id: 'pending', label: 'Pending', count: count('pending') },
  { id: 'suspended', label: 'Suspended', count: count('suspended') },
])

const enriched = computed(() =>
  db.shops.map((s) => ({
    ...s,
    productCount: db.products.filter((p) => p.shopId === s.id).length,
    revenue: sum(db.sales.filter((x) => x.shopId === s.id), (x) => x.total),
  })),
)

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return enriched.value
    .filter((s) => status.value === 'all' || s.status === status.value)
    .filter((s) => !term || s.name.toLowerCase().includes(term) || (owner(s)?.email || '').includes(term) || (owner(s)?.name || '').toLowerCase().includes(term))
})

const statusColor = { active: '#0E9F6E', pending: '#E39A0B', suspended: '#E5484D' }
const markers = computed(() =>
  filtered.value.map((s) => ({
    id: s.id,
    lat: s.lat,
    lng: s.lng,
    color: statusColor[s.status],
    icon: catById(s.category).icon,
    title: s.name,
    popup: `<b>${escapeHtml(s.name)}</b><br>${escapeHtml(s.status)}`,
  })),
)

// ---------- register a shop ----------
const registering = ref(false)
const saving = ref(false)
const regError = ref('')
const blank = () => ({ shopName: '', category: 'groceries', hours: '', address: '', description: '', pin: null, ownerName: '', phone: '', email: '' })
const form = ref(blank())
function openRegister() {
  form.value = blank()
  regError.value = ''
  registering.value = true
}
async function register() {
  regError.value = ''
  if (!form.value.shopName.trim()) return (regError.value = 'Give the shop a name.')
  if (!form.value.email.trim()) return (regError.value = "Enter the owner's email. Their sign-in code is sent there.")
  saving.value = true
  try {
    const f = form.value
    await api('/admin/shops', {
      method: 'POST',
      body: {
        shop: { name: f.shopName, category: f.category, hours: f.hours, address: f.address, description: f.description, phone: f.phone, lat: f.pin?.lat, lng: f.pin?.lng },
        owner: { name: f.ownerName, email: f.email, phone: f.phone },
      },
    })
    await db.refresh()
    registering.value = false
    toast(`${f.shopName} is registered. The owner can now sign in with ${f.email}${f.phone ? ` or ${f.phone}` : ''}.`)
  } catch (e) {
    regError.value = e.message
  } finally {
    saving.value = false
  }
}

function setStatus(s, value) {
  db.updateShop(s.id, { status: value })
  toast(`${s.name} is now ${value}`, value === 'active' ? 'success' : 'info')
}
function manage(s) {
  auth.setAdminShop(s.id)
  router.push({ name: 'shop-dashboard' })
}
function remove(s) {
  if (!confirm(`Delete "${s.name}"? All its products, sales and expenses will be removed. The owner's account stays.`)) return
  db.deleteShop(s.id)
  toast('Shop deleted', 'info')
}
</script>

<style scoped>
.sec {
  margin: 6px 0 -4px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 19px;
  flex: none;
}
tr.sel td {
  background: var(--brand-50);
}
tbody tr {
  cursor: pointer;
}
.status-select {
  height: 32px;
  width: 128px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 99px;
}
.status-select.active {
  color: var(--success);
  background: var(--success-50);
  border-color: transparent;
}
.status-select.pending {
  color: var(--warning);
  background: var(--warning-50);
  border-color: transparent;
}
.status-select.suspended {
  color: var(--danger);
  background: var(--danger-50);
  border-color: transparent;
}
</style>
