<template>
  <!-- Decorative rotating photo background (same crossfade + slow zoom as the landing hero).
       Place inside a positioned parent. -->
  <div class="photo-bg" aria-hidden="true">
    <div
      v-for="(img, i) in photos"
      :key="img"
      class="slide"
      :class="{ on: i === slide }"
      :style="near(i) ? { backgroundImage: `url(${img})` } : null"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { HERO_PHOTOS } from '@/data/heroPhotos'

const props = defineProps({
  /** seconds each photo stays on screen */
  interval: { type: Number, default: 6 },
  /** kept for compatibility with older usage; no effect */
  cols: { type: Number, default: 0 },
  speed: { type: Number, default: 0 },
})

const photos = HERO_PHOTOS
const slide = ref(0)
const prev = ref(-1)
let timer = null

// Only load the photo on screen, the one fading out and the next one.
const near = (i) => i === slide.value || i === prev.value || i === (slide.value + 1) % photos.length

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(() => {
    prev.value = slide.value
    slide.value = (slide.value + 1) % photos.length
  }, props.interval * 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.photo-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: #05140c;
}
.slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.08);
  transition: opacity 1.4s ease;
}
.slide.on {
  opacity: 1;
  animation: kenburns 9s ease-out forwards;
}
@keyframes kenburns {
  from {
    transform: scale(1.14) translate(1.5%, 1%);
  }
  to {
    transform: scale(1.02) translate(0, 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .slide.on {
    animation: none;
  }
}
</style>
