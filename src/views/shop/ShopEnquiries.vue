<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Customer enquiries</h1>
        <p>Questions customers sent from your products in the showcase.</p>
      </div>
      <div class="chips">
        <button v-for="f in filters" :key="f.id" class="chip" :class="{ active: status === f.id }" @click="status = f.id">{{ f.label }} <span class="muted">{{ f.count }}</span></button>
      </div>
    </div>

    <div v-if="list.length" class="stack">
      <article v-for="e in list" :key="e.id" class="card enq">
        <div class="enq-head">
          <div class="avatar">{{ initials(customer(e)?.name || '?') }}</div>
          <div class="grow">
            <strong>{{ customer(e)?.name || 'Customer' }}</strong>
            <small class="muted"> · {{ customer(e)?.email }} · {{ timeAgo(e.createdAt) }}</small>
            <div v-if="product(e)" class="about small">
              <AppIcon name="box" :size="13" /> About <b>{{ product(e).name }}</b>
            </div>
          </div>
          <span class="badge" :class="e.status === 'new' ? 'accent' : 'success'">{{ e.status }}</span>
        </div>
        <p class="msg">{{ e.message }}</p>
        <div v-if="e.reply" class="reply">
          <span class="small strong"><AppIcon name="send" :size="13" /> Your reply · {{ timeAgo(e.repliedAt) }}</span>
          <p>{{ e.reply }}</p>
        </div>
        <form v-else class="reply-form" @submit.prevent="send(e)">
          <input v-model="drafts[e.id]" class="input" placeholder="Write a reply…" />
          <button class="btn btn-primary" :disabled="!drafts[e.id]?.trim()"><AppIcon name="send" :size="16" /> Reply</button>
        </form>
        <div class="row enq-actions">
          <a v-if="customer(e)" :href="`mailto:${customer(e).email}`" class="btn btn-ghost btn-sm"><AppIcon name="mail" :size="15" /> Email</a>
          <button class="btn btn-ghost btn-sm" @click="db.deleteEnquiry(e.id)"><AppIcon name="trash" :size="15" /> Delete</button>
        </div>
      </article>
    </div>
    <div v-else class="card"><EmptyState icon="message" title="No enquiries" text="When customers ask about your products, their messages land here." /></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useCurrentShop } from '@/composables/useCurrentShop'
import { timeAgo, initials } from '@/utils/format'
import { toast } from '@/stores/toast'

const db = useDb()
const shop = useCurrentShop()
const status = ref('all')
const drafts = reactive({})

const all = computed(() => db.enquiries.filter((e) => e.shopId === shop.value.id))
const filters = computed(() => [
  { id: 'all', label: 'All', count: all.value.length },
  { id: 'new', label: 'New', count: all.value.filter((e) => e.status === 'new').length },
  { id: 'replied', label: 'Replied', count: all.value.filter((e) => e.status === 'replied').length },
])
const list = computed(() => all.value.filter((e) => status.value === 'all' || e.status === status.value).sort((a, b) => b.createdAt - a.createdAt))
const customer = (e) => db.users.find((u) => u.id === e.customerId)
const product = (e) => db.products.find((p) => p.id === e.productId)

function send(e) {
  db.replyEnquiry(e.id, drafts[e.id].trim())
  delete drafts[e.id]
  toast('Reply sent')
}
</script>

<style scoped>
.enq {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.enq-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.grow {
  flex: 1;
  min-width: 0;
}
.about {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-2);
  margin-top: 2px;
}
.msg {
  font-size: 15px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--surface-2);
}
.reply {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--brand-50);
  color: var(--brand-700);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.reply-form {
  display: flex;
  gap: 8px;
}
.enq-actions {
  gap: 4px;
  margin: -4px 0 -6px -8px;
}
</style>
