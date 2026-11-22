<template>
  <div class="pimg" :class="{ round }" :style="{ width: size, height: size, background: bg, color: cat.color }">
    <img v-if="product.image && !failed" :src="product.image" :alt="product.name" @error="failed = true" />
    <AppIcon v-else :name="cat.icon" :size="iconPx" :stroke="1.6" class="ph" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { catById } from '@/data/categories'

const props = defineProps({
  product: { type: Object, required: true },
  size: { type: String, default: '100%' },
  iconSize: { type: String, default: '48px' },
  round: { type: Boolean, default: false },
})
const failed = ref(false)
watch(() => props.product.image, () => (failed.value = false))
const cat = computed(() => catById(props.product.category))
const iconPx = computed(() => Math.round(parseFloat(props.iconSize) * 0.85) || 40)
const bg = computed(() => `linear-gradient(135deg, ${cat.value.color}1f, ${cat.value.color}4d)`)
</script>

<style scoped>
.pimg {
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 12px;
  flex: none;
  aspect-ratio: 1;
}
.pimg.round {
  border-radius: 10px;
}
.pimg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ph {
  opacity: 0.85;
}
</style>
