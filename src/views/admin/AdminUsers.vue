<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Users</h1>
        <p>Everyone with an account, what role they have and whether they can sign in.</p>
      </div>
      <button class="btn btn-primary" @click="openNew"><AppIcon name="plus" :size="18" /> Add user</button>
    </div>

    <div class="toolbar">
      <div class="input-icon">
        <AppIcon name="search" :size="18" />
        <input v-model="q" class="input" placeholder="Search by name or email…" />
      </div>
      <div class="chips">
        <button v-for="r in roleFilters" :key="r.id" class="chip" :class="{ active: role === r.id }" @click="role = r.id">
          {{ r.label }} <span class="muted">{{ r.count }}</span>
        </button>
      </div>
    </div>

    <div v-if="loadError" class="alert danger"><AppIcon name="alert" :size="18" /> {{ loadError }}</div>

    <div v-if="loadingList" class="card"><AppLoader text="Loading accounts" style="padding: 40px 0" /></div>
    <div v-else class="card table-wrap">
      <table class="table">
        <thead>
          <tr><th>User</th><th>Role</th><th>Shop</th><th>Status</th><th>Joined</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id">
            <td>
              <div class="cell-main">
                <div class="avatar">{{ initials(u.name) }}</div>
                <div><strong>{{ u.name }} <span v-if="u.id === auth.user.id" class="badge brand">You</span></strong><small>{{ u.email }}</small></div>
              </div>
            </td>
            <td><span class="badge" :class="roleTone(u.role)">{{ roleLabel(u.role) }}</span></td>
            <td class="small">{{ shopOf(u)?.name || '-' }}</td>
            <td>
              <span v-if="!u.verified" class="badge warning"><span class="dot"></span>unconfirmed email</span>
              <span v-else class="badge" :class="u.status === 'active' ? 'success' : 'danger'"><span class="dot"></span>{{ u.status }}</span>
            </td>
            <td class="small muted">{{ fmtDate(u.createdAt) }}</td>
            <td>
              <div v-if="u.role !== 'admin'" class="actions">
                <button class="btn-icon sm" title="Edit" @click="openEdit(u)"><AppIcon name="edit" :size="17" /></button>
                <button class="btn-icon sm" :title="u.status === 'active' ? 'Suspend' : 'Activate'" @click="toggleStatus(u)">
                  <AppIcon :name="u.status === 'active' ? 'lock' : 'check'" :size="17" />
                </button>
                <button class="btn-icon sm danger" title="Delete" @click="remove(u)"><AppIcon name="trash" :size="17" /></button>
              </div>
              <div v-else class="actions"><span class="muted small"><AppIcon name="shield" :size="14" /> Control Centre</span></div>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!filtered.length" icon="users" title="No users found" text="Try a different search or filter." />
    </div>

    <BaseModal :open="modal" :title="form.id ? 'Edit user' : 'Add user'" @close="modal = false">
      <form id="userForm" class="form-grid" @submit.prevent="save">
        <div class="field span-2"><label>Full name</label><input v-model="form.name" class="input" required /></div>
        <div class="field span-2"><label>Email</label><input v-model="form.email" class="input" type="email" required /></div>
        <div class="field">
          <label>Role</label>
          <select v-model="form.role" class="select">
            <option value="customer">Customer</option>
            <option value="shop">Shop owner</option>
          </select>
        </div>
        <div class="field">
          <label>Status</label>
          <select v-model="form.status" class="select">
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div class="field span-2">
          <label>{{ form.id ? 'New password (leave blank to keep)' : 'Password' }}</label>
          <input v-model="form.password" class="input" type="text" :required="!form.id" minlength="6" placeholder="At least 6 characters" />
        </div>
        <p v-if="form.role === 'shop' && !hasShop" class="hint span-2">A shop will be created for this user automatically.</p>
        <div v-if="formError" class="alert danger span-2">{{ formError }}</div>
      </form>
      <template #footer>
        <button class="btn btn-outline" @click="modal = false">Cancel</button>
        <button class="btn btn-primary" type="submit" form="userForm" :disabled="saving">
          <template v-if="saving"><AppLoader variant="inline" /> Saving</template>
          <template v-else>{{ form.id ? 'Save changes' : 'Create user' }}</template>
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import AppLoader from '@/components/AppLoader.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { api } from '@/services/api'
import { fmtDate, initials, isEmail } from '@/utils/format'
import { toast } from '@/stores/toast'

const db = useDb()
const auth = useAuth()
const q = ref('')
const role = ref('all')

// Accounts come from the Fastop API server (the source of truth for logins).
const users = ref([])
const loadingList = ref(true)
const loadError = ref('')
onMounted(load)
async function load() {
  loadingList.value = true
  loadError.value = ''
  try {
    const res = await api('/admin/users')
    users.value = res.users
    res.users.forEach((u) => db.syncUser(u))
  } catch (e) {
    loadError.value = e.message
  } finally {
    loadingList.value = false
  }
}
function upsert(u) {
  const i = users.value.findIndex((x) => x.id === u.id)
  i > -1 ? users.value.splice(i, 1, u) : users.value.unshift(u)
  db.syncUser(u)
}

const roleLabel = (r) => ({ admin: 'Control Centre', shop: 'Shop owner', customer: 'Customer' })[r]
const roleTone = (r) => ({ admin: 'brand', shop: 'accent', customer: 'info' })[r]
const shopOf = (u) => db.shops.find((s) => s.ownerId === u.id)

const roleFilters = computed(() => [
  { id: 'all', label: 'All', count: users.value.length },
  { id: 'shop', label: 'Shop owners', count: users.value.filter((u) => u.role === 'shop').length },
  { id: 'customer', label: 'Customers', count: users.value.filter((u) => u.role === 'customer').length },
])

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return users.value
    .filter((u) => role.value === 'all' || u.role === role.value)
    .filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.includes(term))
    .sort((a, b) => b.createdAt - a.createdAt)
})

const modal = ref(false)
const saving = ref(false)
const formError = ref('')
const form = reactive({ id: null, name: '', email: '', role: 'customer', status: 'active', password: '' })
const hasShop = computed(() => form.id && db.shops.some((s) => s.ownerId === form.id))

function openNew() {
  Object.assign(form, { id: null, name: '', email: '', role: 'customer', status: 'active', password: '' })
  formError.value = ''
  modal.value = true
}
function openEdit(u) {
  Object.assign(form, { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, password: '' })
  formError.value = ''
  modal.value = true
}

async function save() {
  formError.value = ''
  const email = form.email.trim().toLowerCase()
  if (!isEmail(email)) return (formError.value = 'Enter a valid email address.')
  if ((!form.id || form.password) && form.password.length < 6) return (formError.value = 'Password must be at least 6 characters.')

  saving.value = true
  try {
    if (form.id) {
      const patch = { name: form.name.trim(), email, role: form.role, status: form.status }
      if (form.password) patch.password = form.password
      const { user } = await api(`/admin/users/${form.id}`, { method: 'PATCH', body: patch })
      upsert(user)
      toast('User updated')
    } else {
      const { user } = await api('/admin/users', { method: 'POST', body: { email, password: form.password, role: form.role, name: form.name, status: form.status } })
      upsert(user)
      toast('User created')
    }
    modal.value = false
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function toggleStatus(u) {
  const status = u.status === 'active' ? 'suspended' : 'active'
  try {
    const { user } = await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { status } })
    upsert(user)
    toast(`${u.name} is now ${status}`, 'info')
  } catch (e) {
    toast(e.message, 'error')
  }
}

async function remove(u) {
  const shop = shopOf(u)
  if (!confirm(`Delete ${u.name}?${shop ? ` Their shop "${shop.name}" and all its data will also be deleted.` : ''}`)) return
  try {
    await api(`/admin/users/${u.id}`, { method: 'DELETE' })
    users.value = users.value.filter((x) => x.id !== u.id)
    db.removeUserLocal(u.id)
    toast('User deleted', 'info')
  } catch (e) {
    toast(e.message, 'error')
  }
}
</script>
