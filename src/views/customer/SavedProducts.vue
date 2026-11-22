<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Saved products</h1>
        <p>Things you tapped the heart on.</p>
      </div>
    </div>
    <div v-if="saved.length" class="pgrid">
      <ProductCard v-for="p in saved" :key="p.id" :product="p" />
    </div>
    <div v-else class="card">
      <EmptyState icon="heart" title="Nothing saved yet" text="Tap the heart on any product to keep it here.">
        <RouterLink :to="{ name: 'explore-products' }" class="btn btn-accent">Browse products</RouterLink>
      </EmptyState>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'

const db = useDb()
const auth = useAuth()
const saved = computed(() => {
  const ids = auth.user.favorites || []
  return db.publicProducts.filter((p) => ids.includes(p.id))
})
</script>

<style scoped>
.pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}
</style>
