<template>
  <div class="loader" :class="[variant, { light }]" role="status" aria-live="polite">
    <div class="scene" :style="{ '--s': scale }">
      <span class="speed s1"></span>
      <span class="speed s2"></span>
      <span class="speed s3"></span>
      <svg class="cart" viewBox="0 0 64 52" aria-hidden="true">
        <defs>
          <linearGradient id="fx-cart-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#4ADE80" />
            <stop offset="1" stop-color="#15803D" />
          </linearGradient>
        </defs>
        <path d="M4 6h8l7 26h30l7-20H15" fill="none" stroke="url(#fx-cart-g)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M20 18h33l-4.5 11H23z" fill="#86EFAC" opacity="0.55" />
        <g class="wheel" style="transform-origin: 23px 43px"><circle cx="23" cy="43" r="5.5" fill="#14532D" /><path d="M23 39v8M19 43h8" stroke="#BBF7D0" stroke-width="1.6" /></g>
        <g class="wheel" style="transform-origin: 46px 43px"><circle cx="46" cy="43" r="5.5" fill="#14532D" /><path d="M46 39v8M42 43h8" stroke="#BBF7D0" stroke-width="1.6" /></g>
      </svg>
      <span class="road"></span>
    </div>
    <p v-if="text" class="text">{{ text }}<span class="dots"><i>.</i><i>.</i><i>.</i></span></p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  /** 'block' (centered), 'overlay' (full screen), 'inline' (small, inside buttons) */
  variant: { type: String, default: 'block' },
  light: { type: Boolean, default: false },
})
const scale = computed(() => (props.variant === 'inline' ? 0.42 : props.variant === 'overlay' ? 1.15 : 1))
</script>

<style scoped>
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.loader.overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: fade-in 0.25s ease both;
}
.loader.inline {
  display: inline-flex;
  flex-direction: row;
  gap: 0;
  vertical-align: middle;
}
.scene {
  position: relative;
  width: calc(120px * var(--s));
  height: calc(64px * var(--s));
}
.cart {
  position: absolute;
  left: calc(34px * var(--s));
  bottom: calc(6px * var(--s));
  width: calc(64px * var(--s));
  height: calc(52px * var(--s));
  animation: bump 0.45s ease-in-out infinite;
}
.wheel {
  animation: spin 0.5s linear infinite;
}
.speed {
  position: absolute;
  left: 0;
  height: calc(4px * var(--s));
  border-radius: 4px;
  background: linear-gradient(90deg, transparent, #4ade80);
  animation: dash 0.7s linear infinite;
}
.s1 {
  top: calc(16px * var(--s));
  width: calc(30px * var(--s));
}
.s2 {
  top: calc(28px * var(--s));
  width: calc(40px * var(--s));
  animation-delay: -0.25s;
}
.s3 {
  top: calc(40px * var(--s));
  width: calc(24px * var(--s));
  animation-delay: -0.5s;
}
.road {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(3px * var(--s));
  border-radius: 3px;
  background: repeating-linear-gradient(90deg, #86efac 0 calc(14px * var(--s)), transparent calc(14px * var(--s)) calc(24px * var(--s)));
  animation: road 0.5s linear infinite;
  opacity: 0.8;
}
.text {
  margin: 0;
  font-weight: 700;
  font-size: 15px;
  color: var(--text-2);
}
.light .text {
  color: #fff;
}
.dots i {
  font-style: normal;
  animation: blink 1.2s infinite;
}
.dots i:nth-child(2) {
  animation-delay: 0.2s;
}
.dots i:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bump {
  50% {
    transform: translateY(calc(-2px * var(--s))) rotate(-1.5deg);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes dash {
  from {
    transform: translateX(calc(18px * var(--s)));
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  to {
    transform: translateX(calc(-14px * var(--s)));
    opacity: 0;
  }
}
@keyframes road {
  to {
    background-position: calc(-24px * var(--s)) 0;
  }
}
@keyframes blink {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cart,
  .wheel,
  .speed,
  .road,
  .dots i {
    animation-duration: 2.4s;
  }
}
</style>
