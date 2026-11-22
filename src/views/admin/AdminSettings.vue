<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Platform settings</h1>
        <p>Configure how Fastop behaves for every shop and customer.</p>
      </div>
    </div>

    <form class="grid grid-2" @submit.prevent="save">
      <div class="card">
        <div class="card-head"><h3>General</h3></div>
        <div class="card-body stack">
          <div class="field">
            <label>Default currency</label>
            <select v-model="form.currency" class="select">
              <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
            </select>
            <span class="hint">Used in every Shop Manager. Customers never see prices.</span>
          </div>
          <div class="field">
            <label>Support email</label>
            <input v-model="form.supportEmail" class="input" type="email" />
          </div>
          <div class="field">
            <label>Announcement banner</label>
            <textarea v-model="form.announcement" class="textarea" placeholder="e.g. Fastop will be under maintenance on Sunday from 2am to 4am"></textarea>
            <span class="hint">Shown at the top of the Shop Manager and Customer interfaces. Leave empty to hide.</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Registration & moderation</h3></div>
        <div class="card-body stack">
          <label class="switch"><input v-model="form.allowShopSignup" type="checkbox" /> Allow new shop owners to sign up</label>
          <label class="switch"><input v-model="form.requireShopApproval" type="checkbox" /> New shops need admin approval before going live</label>
          <div class="field">
            <label>Default map centre (lat, lng)</label>
            <div class="row">
              <input v-model.number="form.lat" class="input" type="number" step="any" />
              <input v-model.number="form.lng" class="input" type="number" step="any" />
            </div>
            <span class="hint">New shops are placed near this point until the owner sets their exact location.</span>
          </div>
        </div>
      </div>

      <div class="span-all row save-row">
        <button class="btn btn-primary" type="submit"><AppIcon name="check" :size="18" /> Save settings</button>
      </div>
    </form>

    <div class="card danger-zone">
      <div class="card-head"><h3>Danger zone</h3></div>
      <div class="card-body row between wrap">
        <div>
          <strong>Reset platform</strong>
          <p class="muted small">Permanently deletes every shop, product, sale, expense, enquiry and the activity log from the database, and restores default settings. Accounts are kept (shop owners get a fresh empty shop).</p>
        </div>
        <button class="btn btn-danger" @click="reset"><AppIcon name="refresh" :size="17" /> Reset platform</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { CURRENCIES } from '@/data/categories'
import { toast } from '@/stores/toast'

const db = useDb()
const auth = useAuth()
const router = useRouter()
const s = db.settings
const form = reactive({
  currency: s.currency,
  supportEmail: s.supportEmail,
  announcement: s.announcement,
  allowShopSignup: s.allowShopSignup,
  requireShopApproval: s.requireShopApproval,
  lat: s.mapCenter[0],
  lng: s.mapCenter[1],
})

function save() {
  const { lat, lng, ...rest } = form
  db.updateSettings({ ...rest, announcement: rest.announcement.trim(), mapCenter: [Number(lat) || 0, Number(lng) || 0] })
  toast('Settings saved')
}

async function reset() {
  if (!confirm('Delete ALL shops, products, sales, expenses and enquiries from the database? Accounts are kept. This cannot be undone.')) return
  try {
    await db.resetPlatform()
    toast('Platform data reset. Accounts were kept.', 'info')
  } catch {}
}
</script>

<style scoped>
.span-all {
  grid-column: 1 / -1;
}
.save-row {
  justify-content: flex-end;
}
.danger-zone {
  border-color: color-mix(in srgb, var(--danger) 35%, transparent);
}
.danger-zone .card-head h3 {
  color: var(--danger);
}
@media (max-width: 720px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
