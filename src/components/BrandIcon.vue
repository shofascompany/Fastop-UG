<template>
  <span class="brand-ico" :class="name" :style="{ width: size + 'px', height: size + 'px' }">
    <!-- Gmail: the real four-colour M on white -->
    <svg v-if="name === 'email'" viewBox="52 42 88 66" :width="size * 0.62" :height="size * 0.62" aria-hidden="true">
      <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
    </svg>
    <svg v-else viewBox="0 0 24 24" :width="size * glyph" :height="size * glyph" fill="currentColor" aria-hidden="true">
      <path :d="BRAND_ICONS[name]" />
    </svg>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { BRAND_ICONS } from '@/data/contact'

const props = defineProps({
  name: { type: String, required: true }, // whatsapp | instagram | email | phone
  size: { type: Number, default: 40 },
})
const glyph = computed(() => (props.name === 'instagram' ? 0.54 : 0.58))
</script>

<style scoped>
/* App-icon style tiles in each platform's own colours */
.brand-ico {
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  overflow: hidden;
  border-radius: 28%;
  color: #fff;
  box-shadow: 0 4px 10px -2px var(--glow, rgba(0, 0, 0, 0.3)), inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  transition: transform 0.2s cubic-bezier(0.3, 1.5, 0.5, 1), box-shadow 0.2s;
}
/* soft shine across the top half */
.brand-ico::before {
  content: '';
  position: absolute;
  inset: 0 0 50% 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0));
  pointer-events: none;
}
.brand-ico svg {
  position: relative;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.18));
}
.whatsapp {
  --glow: rgba(37, 211, 102, 0.55);
  background: linear-gradient(180deg, #5ffc7b 0%, #28d146 100%);
}
.instagram {
  --glow: rgba(214, 36, 159, 0.5);
  background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%);
}
.email {
  --glow: rgba(66, 133, 244, 0.35);
  background: #fff;
  box-shadow: 0 4px 10px -2px var(--glow), inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.email::before {
  display: none;
}
.email svg {
  filter: none;
}
.phone {
  --glow: rgba(22, 163, 74, 0.5);
  background: linear-gradient(180deg, #4ade80 0%, #16a34a 100%);
}
</style>
