<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICONS[name] || ICONS.box"
  />
</template>

<script setup>
import { ICONS } from '@/utils/icons'

defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  stroke: { type: [Number, String], default: 2 },
})
</script>

<style scoped>
.icon {
  flex: none;
  display: inline-block;
  vertical-align: middle;
}
</style>
