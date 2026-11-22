<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>My enquiries</h1>
        <p>Messages you've sent to shops and their replies.</p>
      </div>
    </div>

    <div v-if="list.length" class="stack">
      <article v-for="e in list" :key="e.id" class="card thread">
        <div class="row between wrap">
          <RouterLink v-if="product(e)" :to="{ name: 'explore-product', params: { id: e.productId } }" class="about">
            <ProductImage :product="product(e)" size="44px" icon-size="20px" round />
            <div><strong>{{ product(e).name }}</strong><br /><small class="muted">{{ shop(e)?.name }}</small></div>
          </RouterLink>
          <strong v-else>{{ shop(e)?.name || 'Shop' }}</strong>
          <span class="badge" :class="e.status === 'replied' ? 'success' : 'warning'">{{ e.status === 'replied' ? 'Replied' : 'Awaiting reply' }}</span>
        </div>
        <div class="bubble me">
          <p>{{ e.message }}</p>
          <small>You · {{ timeAgo(e.createdAt) }}</small>
        </div>
        <div v-if="e.reply" class="bubble them">
          <p>{{ e.reply }}</p>
          <small>{{ shop(e)?.name }} · {{ timeAgo(e.repliedAt) }}</small>
        </div>
      </article>
    </div>
    <div v-else class="card">
      <EmptyState icon="message" title="No enquiries yet" text="Open any product and tap “Ask the shop” to send a question.">
        <RouterLink :to="{ name: 'explore-products' }" class="btn btn-accent">Browse products</RouterLink>
      </EmptyState>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ProductImage from '@/components/ProductImage.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { timeAgo } from '@/utils/format'

const db = useDb()
const auth = useAuth()
const list = computed(() => db.enquiries.filter((e) => e.customerId === auth.user.id).sort((a, b) => b.createdAt - a.createdAt))
const product = (e) => db.products.find((p) => p.id === e.productId)
const shop = (e) => db.shops.find((s) => s.id === e.shopId)
</script>

<style scoped>
.thread {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.about {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bubble {
  max-width: 80%;
  padding: 12px 14px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bubble small {
  font-size: 11.5px;
  opacity: 0.75;
}
.me {
  align-self: flex-end;
  background: var(--accent);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.them {
  align-self: flex-start;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
</style>
