<template>
  <div class="tour" @keydown.right="next" @keydown.left="back" tabindex="-1" ref="root">
    <div class="tour-card card">
      <div class="tour-top">
        <AppLogo :size="34" />
        <button v-if="!last" type="button" class="skip" @click="finish">Skip tour</button>
      </div>

      <Transition :name="dir === 1 ? 'slide-next' : 'slide-back'" mode="out-in">
        <section :key="i" class="slide">
          <div class="art" :style="{ '--c': slide.color }">
            <span class="ring r1"></span>
            <span class="ring r2"></span>
            <span class="art-ico"><AppIcon :name="slide.icon" :size="44" :stroke="1.8" /></span>
          </div>
          <span class="kicker">Step {{ i + 1 }} of {{ slides.length }}</span>
          <h1>{{ slide.title }}</h1>
          <p>{{ slide.text }}</p>
          <ul v-if="slide.points" class="points">
            <li v-for="pt in slide.points" :key="pt"><AppIcon name="check" :size="15" /> {{ pt }}</li>
          </ul>
        </section>
      </Transition>

      <div class="dots" role="tablist" aria-label="Tour steps">
        <button
          v-for="(s, n) in slides"
          :key="s.title"
          type="button"
          role="tab"
          :aria-selected="n === i"
          :aria-label="`Step ${n + 1}: ${s.title}`"
          :class="{ on: n === i }"
          @click="go(n)"
        ></button>
      </div>

      <div class="nav">
        <button type="button" class="btn btn-outline" :disabled="i === 0" @click="back"><AppIcon name="arrowLeft" :size="16" /> Back</button>
        <button v-if="!last" type="button" class="btn btn-primary" @click="next">Next <AppIcon name="arrowRight" :size="16" /></button>
        <button v-else type="button" class="btn btn-primary" :disabled="saving" @click="finish">Go to my dashboard <AppIcon name="arrowRight" :size="16" /></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useAuth } from '@/stores/auth'
import { useDb } from '@/stores/db'

const auth = useAuth()
const db = useDb()
const router = useRouter()
const root = ref(null)

const shopName = computed(() => db.shops.find((s) => s.ownerId === auth.user?.id)?.name || 'Your shop')
const firstName = computed(() => (auth.user?.name || '').split(' ')[0])

const slides = computed(() => [
  {
    icon: 'store',
    color: '#16a34a',
    title: `Welcome${firstName.value ? `, ${firstName.value}` : ''}. ${shopName.value} is on Fastop.`,
    text: 'Shoppers can already find your shop on the map, with your address, opening hours and directions to your door.',
    points: ['Check your details under Shop profile', 'Drop your pin exactly where the shop is'],
  },
  {
    icon: 'box',
    color: '#0ea5e9',
    title: 'Put your shelves online',
    text: 'Add the products you sell in Inventory. Shoppers see what you have in stock. Prices stay private to you.',
    points: ['Add a photo and a short description', 'Low-stock alerts tell you when to restock'],
  },
  {
    icon: 'cart',
    color: '#f97316',
    title: 'Sell at the counter',
    text: 'Ring up sales in Point of sale. Stock goes down automatically, so what shoppers see stays accurate.',
    points: ['Cash, mobile money, card or bank transfer', 'Print or share a receipt'],
  },
  {
    icon: 'message',
    color: '#8b5cf6',
    title: 'Answer shoppers',
    text: 'When someone asks about a product, it lands in Enquiries. A quick reply often turns into a visit.',
  },
  {
    icon: 'chart',
    color: '#0d9488',
    title: 'See how business is going',
    text: 'Your dashboard shows today’s sales, best sellers and profit after expenses, all in one place.',
    points: ['Log rent, stock purchases and other costs in Expenses'],
  },
])

const i = ref(0)
const dir = ref(1)
const slide = computed(() => slides.value[i.value])
const last = computed(() => i.value === slides.value.length - 1)

function go(n) {
  dir.value = n > i.value ? 1 : -1
  i.value = n
}
const next = () => !last.value && go(i.value + 1)
const back = () => i.value > 0 && go(i.value - 1)

const saving = ref(false)
async function finish() {
  saving.value = true
  await auth.finishTour()
  router.replace({ name: 'shop-dashboard' })
}

onMounted(() => root.value?.focus())
</script>

<style scoped>
.tour {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px var(--gutter, 16px);
  outline: none;
  background: radial-gradient(800px 460px at 0% 0%, var(--hero-glow-1, transparent), transparent 70%), var(--bg);
}
.tour-card {
  width: 100%;
  max-width: 520px;
  padding: 26px 28px 28px;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.tour-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.skip {
  border: 0;
  background: none;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
}
.skip:hover {
  color: var(--text);
}
.slide {
  text-align: center;
  padding: 22px 0 8px;
  min-height: 360px;
}
.art {
  position: relative;
  width: 132px;
  height: 132px;
  margin: 4px auto 22px;
  display: grid;
  place-items: center;
}
.art-ico {
  position: relative;
  width: 92px;
  height: 92px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--c);
  box-shadow: 0 14px 30px -10px var(--c);
  animation: pop 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--c);
  opacity: 0;
  animation: ripple 2.6s ease-out infinite;
}
.r2 {
  animation-delay: 1.3s;
}
@keyframes pop {
  from {
    transform: scale(0.4) rotate(-12deg);
    opacity: 0;
  }
}
@keyframes ripple {
  0% {
    transform: scale(0.6);
    opacity: 0.45;
  }
  100% {
    transform: scale(1.25);
    opacity: 0;
  }
}
.kicker {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--brand);
}
h1 {
  font-size: clamp(22px, 4vw, 27px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 8px 0 10px;
  text-wrap: balance;
}
p {
  color: var(--text-2);
  line-height: 1.6;
  margin: 0 auto;
  max-width: 420px;
}
.points {
  list-style: none;
  padding: 0;
  margin: 16px auto 0;
  display: inline-flex;
  flex-direction: column;
  gap: 7px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
}
.points li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.points .icon {
  color: var(--success);
  flex: none;
}
.dots {
  display: flex;
  justify-content: center;
  gap: 7px;
  margin: 18px 0 20px;
}
.dots button {
  width: 9px;
  height: 9px;
  padding: 0;
  border: 0;
  border-radius: 99px;
  background: var(--border-strong, var(--border));
  cursor: pointer;
  transition: width 0.3s, background 0.3s;
}
.dots button.on {
  width: 28px;
  background: var(--brand);
}
.nav {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.nav .btn {
  min-width: 120px;
}
.slide-next-enter-active,
.slide-next-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s;
}
.slide-next-enter-from,
.slide-back-leave-to {
  transform: translateX(40px);
  opacity: 0;
}
.slide-next-leave-to,
.slide-back-enter-from {
  transform: translateX(-40px);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .ring,
  .art-ico {
    animation: none;
  }
  .slide-next-enter-active,
  .slide-next-leave-active,
  .slide-back-enter-active,
  .slide-back-leave-active {
    transition: none;
  }
}
</style>
