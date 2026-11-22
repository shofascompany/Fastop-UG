<template>
  <div class="landing" ref="landingEl">
    <div class="scroll-progress" aria-hidden="true"></div>
    <PublicHeader overlay />

    <!-- Hero: rotating shop photos -->
    <section class="hero" ref="heroEl">
      <div class="hero-slides" aria-hidden="true" data-speed="0.45">
        <div v-for="(img, i) in heroImages" :key="img" class="slide" :class="{ on: i === slide }" :style="nearSlide(i) ? { backgroundImage: `url(${img})` } : null"></div>
      </div>
      <div class="hero-shade" aria-hidden="true"></div>

      <div class="container hero-in">
        <!-- Left: message + actions -->
        <div class="hero-copy">
          <p class="kicker" v-reveal>
            <span class="ping"></span>
            {{ db.publicShops.length ? `${db.publicShops.length} ${db.publicShops.length === 1 ? 'shop' : 'shops'} on Fastop` : 'Every shop. One search.' }}
          </p>
          <h1 v-reveal class="h1-lines" aria-label="Find anything in any shop.">
            <span class="line" style="--ld: 0.1s" aria-hidden="true">
              <span>Find <span class="rotator"><span class="rw-ghost">{{ heroWords[wordIdx] }}</span><span
                    v-for="(w, i) in heroWords"
                    :key="w"
                    class="rw"
                    :class="{ on: i === wordIdx, out: i === prevIdx }"
                  >{{ w }}</span></span></span>
            </span>
            <span class="line" style="--ld: 0.28s" aria-hidden="true"><span><span class="underline">in any shop.</span></span></span>
          </h1>
          <p class="lead" v-reveal>
            See what's on the shelves at supermarkets, boutiques, pharmacies and phone stores, compare how close they are and when they close, then head straight to the one that has it.
          </p>

          <form class="search" v-reveal @submit.prevent="search">
            <AppIcon name="search" :size="20" />
            <input v-model="q" type="search" placeholder="Search for sneakers, sugar, phone chargers…" aria-label="Search products" />
            <button class="btn btn-orange">Search</button>
          </form>

          <div class="hero-actions" v-reveal>
            <RouterLink v-if="auth.user" :to="auth.homeRoute" class="btn btn-primary btn-lg"><AppIcon name="arrowRight" :size="18" /> Open my account</RouterLink>
            <template v-else>
              <RouterLink :to="{ name: 'auth' }" class="btn btn-primary btn-lg btn-shine"><AppIcon name="lock" :size="18" /> Sign in</RouterLink>
              <RouterLink :to="{ name: 'explore-products' }" class="btn btn-lg hero-ghost"><AppIcon name="search" :size="18" /> Explore</RouterLink>
            </template>
          </div>

          <ul class="trust" v-reveal>
            <li><AppIcon name="tag" :size="16" /> Check stock before you go</li>
            <li><AppIcon name="clock" :size="16" /> Distance and opening hours</li>
            <li><AppIcon name="pin" :size="16" /> Directions to the door</li>
          </ul>
        </div>

        <!-- Right (laptops): how Fastop works, as floating cards -->
        <div class="hero-visual" aria-hidden="true">
          <div v-for="(c, i) in heroCards" :key="c.title" class="hcard" :style="{ '--i': i }">
            <span class="hcard-ico"><AppIcon :name="c.icon" :size="22" /></span>
            <div>
              <b>{{ c.title }}</b>
              <small>{{ c.text }}</small>
            </div>
            <span class="hcard-step">{{ i + 1 }}</span>
          </div>
        </div>
      </div>

    </section>

    <!-- Scrolling category strip -->
    <div class="strip" aria-hidden="true">
      <div class="strip-track">
        <span v-for="(w, i) in [...stripWords, ...stripWords]" :key="i">{{ w }}<i></i></span>
      </div>
    </div>
    <div class="strip strip-dark" aria-hidden="true">
      <div class="strip-track">
        <span v-for="(w, i) in [...stripTags, ...stripTags]" :key="i">{{ w }}<i></i></span>
      </div>
    </div>

    <!-- Categories -->
    <section id="categories" class="section container">
      <div class="head-row">
        <div>
          <span class="num">01</span>
          <h2 v-reveal:wipe>Shop by what you need</h2>
        </div>
        <RouterLink :to="{ name: 'explore-products' }" class="link-arrow">Browse all products <AppIcon name="arrowRight" :size="16" /></RouterLink>
      </div>

      <div class="cats">
        <RouterLink v-for="(c, i) in catTiles" :key="c.title" :to="c.to" class="cat" :class="c.size" v-reveal:zoom v-tilt :style="{ '--d': i * 80 + 'ms' }">
          <img :src="c.img" :alt="c.alt" loading="lazy" data-speed="0.06" />
          <div class="cat-txt">
            <h3>{{ c.title }}</h3>
            <span>{{ c.note }}</span>
          </div>
          <span class="cat-go"><AppIcon name="arrowRight" :size="18" /></span>
        </RouterLink>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="section how-wrap">
      <span class="blob blob-a" aria-hidden="true"></span>
      <span class="blob blob-b" aria-hidden="true"></span>
      <div class="container">
        <div class="head-row">
          <div>
            <span class="num">02</span>
            <h2 v-reveal:wipe>From search to shop in three steps</h2>
          </div>
        </div>

        <div class="how">
          <svg class="how-line" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 30 C 160 -10, 330 70, 500 30 S 840 -10, 1000 30" />
          </svg>
          <div v-for="(s, i) in steps" :key="s.title" class="how-step" v-reveal:zoom :style="{ '--d': i * 150 + 'ms' }">
            <div class="how-ico"><AppIcon :name="s.icon" :size="24" /></div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Parallax band -->
    <section class="band">
      <img class="pbg" src="/img/market.jpg" alt="" aria-hidden="true" data-speed="0.25" />
      <div class="band-shade"></div>
      <div class="container band-in">
        <blockquote v-reveal:wipe>
          “Why are there no prices?”
          <span>Prices move daily and every shopkeeper sets their own. Fastop shows you what's in stock and exactly where to find it. The final price is yours to agree, face to face.</span>
        </blockquote>
      </div>
    </section>

    <!-- Nearby shops -->
    <section id="shops" class="section container">
      <div class="head-row">
        <div>
          <span class="num">03</span>
          <h2 v-reveal:wipe>See exactly where to go</h2>
        </div>
        <RouterLink :to="{ name: 'explore-map' }" class="link-arrow">Open the map <AppIcon name="arrowRight" :size="16" /></RouterLink>
      </div>

      <div class="shops-layout">
        <RouterLink ref="mapCardEl" :to="{ name: 'explore-map' }" class="map-card demo" v-reveal:left aria-label="Preview of the shop map. Open the map">
          <!-- the map (and Leaflet) loads only when this section comes near the screen, so it never slows the first paint -->
          <MapDemo v-if="showMap" @change="demoIdx = $event" />
        </RouterLink>

        <div class="shop-list">
          <RouterLink
            v-for="(s, i) in shops"
            :key="s.id"
            :to="{ name: 'explore-shop', params: { id: s.id } }"
            class="shop-row"
            v-reveal
            :style="{ '--d': i * 90 + 'ms' }"
          >
            <img :src="catPhoto(s.category)" alt="" loading="lazy" />
            <div class="shop-meta">
              <b>{{ s.name }}</b>
              <small><AppIcon name="pin" :size="13" /> {{ s.address }}</small>
              <small><AppIcon name="clock" :size="13" /> {{ s.hours }}</small>
            </div>
            <div class="shop-side">
              <span class="tag"><AppIcon :name="catById(s.category).icon" :size="13" /> {{ catById(s.category).label }}</span>
              <small>{{ productCount(s.id) }} {{ productCount(s.id) === 1 ? 'item' : 'items' }}</small>
            </div>
          </RouterLink>
          <!-- Until real shops join, show the shops from the map demo -->
          <template v-if="!shops.length">
            <RouterLink
              v-for="(t, i) in DEMO_TRIPS"
              :key="t.id"
              :to="{ name: 'explore-map' }"
              class="shop-row"
              :class="{ current: i === demoIdx }"
              v-reveal:right
              :style="{ '--d': 150 + i * 110 + 'ms' }"
            >
              <img :src="catPhoto(t.category)" alt="" loading="lazy" />
              <div class="shop-meta">
                <b>{{ t.name }}</b>
                <small><AppIcon name="pin" :size="13" /> {{ t.address }}</small>
                <small><AppIcon name="clock" :size="13" /> {{ t.hours }}</small>
              </div>
              <div class="shop-side">
                <span class="tag"><AppIcon :name="catById(t.category).icon" :size="13" /> {{ catById(t.category).label }}</span>
                <small>{{ t.distance }} · {{ t.walk }}</small>
              </div>
            </RouterLink>
          </template>
        </div>
      </div>

    </section>

    <!-- Fresh products -->
    <section v-if="latest.length" id="new" class="section new-wrap">
      <div class="container">
        <div class="head-row">
          <div>
            <span class="num">04</span>
            <h2 v-reveal:wipe>Just arrived on the shelves</h2>
          </div>
          <RouterLink :to="{ name: 'explore-products', query: { sort: 'new' } }" class="link-arrow">See all new arrivals <AppIcon name="arrowRight" :size="16" /></RouterLink>
        </div>
        <div class="pgrid">
          <div v-for="(p, i) in latest" :key="p.id" v-reveal:zoom :style="{ '--d': i * 90 + 'ms' }">
            <ProductCard :product="p" />
          </div>
        </div>
      </div>
    </section>

    <!-- Get the app (hidden once installed) -->
    <section id="app" class="section container get-app-sec" v-reveal:zoom>
      <InstallCard feature />
    </section>

    <!-- Closing CTA -->
    <section class="closing">
      <img class="pbg" src="/img/open-sign.jpg" alt="" aria-hidden="true" data-speed="0.25" />
      <div class="closing-shade"></div>
      <div class="container closing-in">
        <h2 v-reveal:wipe>Everything you need is closer than you think.</h2>
        <p v-reveal style="--d: 150ms">Search every shop on Fastop, see who has it in stock, message them directly and follow the route to their door.</p>
        <div class="closing-cta" v-reveal style="--d: 300ms">
          <RouterLink :to="{ name: 'explore-home' }" class="btn btn-primary btn-lg btn-shine">Start exploring <AppIcon name="arrowRight" :size="18" /></RouterLink>
          <RouterLink :to="{ name: 'explore-map' }" class="btn btn-lg ghost-light"><AppIcon name="map" :size="18" /> Open the map</RouterLink>
        </div>
      </div>
    </section>

    <PublicFooter hide-install />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import PublicHeader from '@/components/PublicHeader.vue'
import PublicFooter from '@/components/PublicFooter.vue'
import AppIcon from '@/components/AppIcon.vue'
// Below-the-fold pieces load separately so the hero shows without waiting for them
// (MapDemo pulls in the 150 KB Leaflet map library).
const ProductCard = defineAsyncComponent(() => import('@/components/ProductCard.vue'))
const InstallCard = defineAsyncComponent(() => import('@/components/InstallCard.vue'))
const MapDemo = defineAsyncComponent(() => import('@/components/MapDemo.vue'))
import { lockLightTheme } from '@/composables/useTheme'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'
import { HERO_PHOTOS } from '@/data/heroPhotos'
import { CATEGORIES, catById } from '@/data/categories'
import { DEMO_TRIPS } from '@/data/mapDemo' // plain data, keeps Leaflet out of the first load

const db = useDb()
const auth = useAuth()
const router = useRouter()

const heroImages = HERO_PHOTOS
const slide = ref(0)
let timer = null
const next = () => (slide.value = (slide.value + 1) % heroImages.length)
// Only load the photo on screen, the one fading out and the next one, so 20 photos don't all download at once.
const prevSlide = ref(-1)
watch(slide, (_, old) => (prevSlide.value = old))
const nearSlide = (i) => i === slide.value || i === prevSlide.value || i === (slide.value + 1) % heroImages.length

const q = ref('')
function search() {
  const term = q.value.trim()
  router.push({ name: 'explore-products', query: term ? { q: term } : {} })
}

const heroCards = [
  { icon: 'search', title: 'Search once', text: 'Every shop, every shelf' },
  { icon: 'map', title: 'See who\'s closest', text: 'Distance, hours and directions' },
  { icon: 'message', title: 'Reach the shop', text: 'Message, call or walk in' },
]

// Headline: "Find ___ in any shop." with the blank cycling through these
const heroWords = ['groceries', 'phones', 'sneakers', 'medicine', 'spare parts', 'school books', 'anything']
const wordIdx = ref(heroWords.length - 1)
const prevIdx = ref(-1)
let wordTimer = null
function nextWord() {
  prevIdx.value = wordIdx.value
  wordIdx.value = (wordIdx.value + 1) % heroWords.length
}

const stripTags = ['Search every shelf', 'See what\'s in stock', 'Find the closest shop', 'Message the seller', 'Walk in and buy']
const stripWords = CATEGORIES.filter((c) => c.id !== 'other').map((c) => c.label)

const catTiles = [
  { title: 'Groceries', note: 'Fresh produce and everyday staples', img: '/img/grocery.jpg', alt: 'Vegetables on supermarket shelves', size: 'tall', to: { name: 'explore-products', query: { cat: 'groceries' } } },
  { title: 'Fashion', note: 'Clothing, footwear and accessories', img: '/img/boutique.jpg', alt: 'Inside a clothing shop', size: 'wide', to: { name: 'explore-products', query: { cat: 'fashion' } } },
  { title: 'Electronics', note: 'Phones, gadgets and chargers', img: '/img/electronics.jpg', alt: 'A smartphone next to a laptop', size: '', to: { name: 'explore-products', query: { cat: 'electronics' } } },
  { title: 'Beauty', note: 'Skincare, makeup and fragrance', img: '/img/beauty.jpg', alt: 'Makeup products on a marble table', size: '', to: { name: 'explore-products', query: { cat: 'beauty' } } },
  { title: 'Everything else', note: 'Homeware, hardware, books and sport', img: '/img/aisle.jpg', alt: 'A supermarket aisle', size: 'wide', to: { name: 'explore-products' } },
]

const catPhotos = { groceries: '/img/grocery.jpg', fashion: '/img/rack.jpg', electronics: '/img/electronics.jpg', beauty: '/img/beauty.jpg' }
const catPhoto = (id) => catPhotos[id] || '/img/aisle.jpg'

const steps = [
  { icon: 'search', title: 'Search', text: 'Look up any product or browse a category to see every shop that stocks it.' },
  { icon: 'map', title: 'Choose the closest', text: 'Compare distance and opening hours, then get directions in one tap.' },
  { icon: 'message', title: 'Go and get it', text: 'Message the shop, give them a call, or walk straight in.' },
]

const shops = computed(() => db.publicShops.slice(0, 4))
const demoIdx = ref(0) // which demo shop the map preview is routing to

const productCount = (shopId) => db.publicProducts.filter((p) => p.shopId === shopId).length
const latest = computed(() => [...db.publicProducts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4))

// Fade elements up as they enter the viewport
const pending = new Set()
let io = null
// v-reveal fades up; v-reveal:left / :right / :zoom / :wipe pick the direction
const vReveal = {
  mounted(el, binding) {
    el.classList.add('reveal')
    if (binding.arg) el.classList.add(`reveal-${binding.arg}`)
    io ? io.observe(el) : pending.add(el)
  },
}

// Gentle 3D tilt that follows the mouse (desktop only)
const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
const vTilt = {
  mounted(el) {
    if (!canHover || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.addEventListener('mousemove', (e) => {
      el.classList.add('tilting')
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg')
      el.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg')
    })
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--ry', '0deg')
      el.style.setProperty('--rx', '0deg')
    })
  },
}

const landingEl = ref(null)

// Scroll parallax: each [data-speed] layer drifts against the scroll, measured
// from its parent's position so the layer's own transform doesn't feed back in.
const heroEl = ref(null)
let layers = []
let ticking = false
function updateParallax() {
  ticking = false
  const vh = window.innerHeight
  for (const el of layers) {
    const r = el.parentElement.getBoundingClientRect()
    if (r.bottom < -200 || r.top > vh + 200) continue
    const offset = (vh / 2 - (r.top + r.height / 2)) * el.dataset.speed
    el.style.setProperty('--py', offset.toFixed(1) + 'px')
  }
  if (heroEl.value) {
    const p = Math.min(1, Math.max(0, window.scrollY / vh))
    heroEl.value.style.setProperty('--hp', p.toFixed(3))
  }
  if (landingEl.value) {
    const max = document.documentElement.scrollHeight - vh
    landingEl.value.style.setProperty('--sp', max > 0 ? (window.scrollY / max).toFixed(4) : '0')
  }
}
function onScroll() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(updateParallax)
  }
}

// The landing page is always light (white), whatever theme the visitor picked elsewhere.
lockLightTheme(true)

const mapCardEl = ref(null)
const showMap = ref(false)
let mapIo = null

onMounted(() => {
  const mapNode = mapCardEl.value?.$el
  if (!mapNode || !('IntersectionObserver' in window)) showMap.value = true
  else {
    mapIo = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        showMap.value = true
        mapIo.disconnect()
      },
      { rootMargin: '400px 0px' },
    )
    mapIo.observe(mapNode)
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduce) {
    timer = setInterval(next, 6000)
    // first swap waits for the headline's entrance to finish
    setTimeout(() => {
      nextWord()
      wordTimer = setInterval(nextWord, 2400)
    }, 2200)
    layers = [...document.querySelectorAll('.landing [data-speed]')]
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateParallax()
  }

  if (reduce || !('IntersectionObserver' in window)) {
    pending.forEach((el) => el.classList.add('in'))
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    },
    { threshold: 0.15 },
  )
  pending.forEach((el) => io.observe(el))
})

onBeforeUnmount(() => {
  mapIo?.disconnect()
  lockLightTheme(false)
  clearInterval(wordTimer)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  clearInterval(timer)
  io?.disconnect()
})
</script>

<style scoped>
.landing {
  background: #ffffff;
  overflow-x: hidden;
}

/* reveal on scroll */
.reveal {
  opacity: 0;
  transform: translateY(26px);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
  transition-delay: var(--d, 0ms);
}
.reveal.in {
  opacity: 1;
  transform: none;
}
.reveal-left {
  transform: translateX(-60px);
}
.reveal-right {
  transform: translateX(60px);
}
.reveal-zoom {
  transform: translateY(20px) scale(0.92);
  transition-duration: 0.8s;
}
/* headings rise out of an invisible slot */
.reveal-wipe {
  opacity: 1;
  transform: translateY(30px);
  clip-path: inset(0 0 100% 0);
  transition: clip-path 0.9s cubic-bezier(0.6, 0, 0.2, 1), transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
  transition-delay: var(--d, 0ms);
}
.reveal-wipe.in {
  clip-path: inset(0 0 -20% 0);
}

/* ---------- hero ---------- */
.hero {
  position: relative;
  margin-top: -72px;
  padding-top: 72px;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  color: #fff;
  isolation: isolate;
  overflow: hidden;
}
.hero-slides {
  position: absolute;
  inset: 0;
  z-index: -2;
  overflow: hidden;
  background: #05140c;
  transform: translate3d(0, var(--py, 0px), 0) scale(calc(1 + var(--hp, 0) * 0.12));
  will-change: transform;
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
.hero-shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(100deg, rgba(5, 20, 12, 0.88) 0%, rgba(5, 20, 12, 0.62) 45%, rgba(5, 20, 12, 0.25) 100%),
    linear-gradient(0deg, rgba(5, 20, 12, 0.55), transparent 40%);
}
.hero-in {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  align-items: center;
  gap: clamp(24px, 5vw, 72px);
  padding: clamp(28px, 6vh, 64px) 0 clamp(80px, 12vh, 120px);
  opacity: calc(1 - var(--hp, 0) * 1.3);
  transform: translateY(calc(var(--hp, 0) * -90px));
}
.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px 7px 12px;
  border-radius: 99px;
  font-size: 13.5px;
  font-weight: 700;
  color: #fff;
  background: rgba(8, 12, 10, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(6px);
}
.ping {
  position: relative;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--orange);
}
.ping::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--orange);
  animation: ping 1.8s ease-out infinite;
}
@keyframes ping {
  to {
    transform: scale(3);
    opacity: 0;
  }
}
.hero h1 {
  margin: 18px 0 18px;
  /* scales with width AND height so it fits phones and short laptop screens */
  font-size: clamp(34px, min(6.2vw, 9.5vh), 78px);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.045em;
  max-width: 820px;
}
.underline {
  position: relative;
  white-space: nowrap;
  z-index: 0;
}
.underline::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.04em;
  height: 0.14em;
  background: var(--grad-orange);
  border-radius: 4px;
  z-index: -1;
  transform-origin: left;
  animation: draw 0.9s 0.6s cubic-bezier(0.6, 0, 0.2, 1) both;
}
@keyframes draw {
  from {
    transform: scaleX(0);
  }
}
.lead {
  font-size: clamp(15.5px, 1.5vw, 19px);
  color: #e3f1e7;
  max-width: 560px;
}
.search {
  margin-top: clamp(20px, 4vh, 32px);
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 600px;
  padding: 8px 8px 8px 18px;
  border-radius: 16px;
  background: var(--surface);
  color: var(--muted);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}
.search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  height: 44px;
  font-size: 16px;
  color: var(--text);
}
.search .btn {
  height: 46px;
  border-radius: 11px;
}
.hero-actions {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.hero-ghost {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.45);
  color: #fff;
  backdrop-filter: blur(6px);
}
.hero-ghost:hover {
  background: rgba(255, 255, 255, 0.22);
}
.quick {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: #cfe5d6;
}
.quick a {
  padding: 6px 14px;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-weight: 600;
  backdrop-filter: blur(4px);
  transition: background 0.2s, border-color 0.2s;
}
.quick a:hover {
  background: rgba(34, 197, 94, 0.3);
  border-color: #86efac;
}
.trust {
  list-style: none;
  margin: 22px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #e3f1e7;
}
.trust li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.trust .icon {
  width: 22px;
  height: 22px;
  padding: 3px;
  border-radius: 50%;
  background: #22c55e;
  color: #fff;
}

/* right column: floating "how it works" cards */
.hero-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 40px 0 0 24px;
}
.hcard {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.6);
  margin-left: calc(var(--i) * 26px);
  animation: float 6s calc(var(--i) * -2s) ease-in-out infinite;
}
.hcard b {
  display: block;
  font-size: 16px;
}
.hcard small {
  font-size: 13px;
  color: #d7eadc;
}
.hcard-ico {
  width: 46px;
  height: 46px;
  flex: none;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #0b0f0d;
  color: #86efac;
  border: 1px solid rgba(134, 239, 172, 0.35);
  box-shadow: 0 10px 24px -12px rgba(0, 0, 0, 0.8);
}
.hcard-step {
  margin-left: auto;
  font-size: 28px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.25);
}
@keyframes float {
  50% {
    transform: translateY(-8px);
  }
}
.sticker {
  position: absolute;
  top: -18px;
  right: 0;
  z-index: 2;
  width: 108px;
  height: 108px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.05;
  background: var(--grad-orange);
  color: #fff;
  box-shadow: var(--shadow-orange), 0 0 0 6px rgba(249, 115, 22, 0.22);
  transform: rotate(12deg);
  animation: spin-in 0.9s 0.4s cubic-bezier(0.3, 1.5, 0.5, 1) both;
}
.sticker b {
  font-size: 26px;
  font-weight: 800;
}
.sticker span {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
@keyframes spin-in {
  from {
    transform: rotate(-40deg) scale(0.4);
    opacity: 0;
  }
}
/* ---------- strip ---------- */
.strip {
  background: #0b0f0d;
  color: #fff;
  overflow: hidden;
  padding: 16px 0;
  transform: rotate(-1.2deg);
  margin: -14px -20px 0;
  position: relative;
  z-index: 2;
}
.strip-track {
  display: flex;
  width: max-content;
  animation: marquee 32s linear infinite;
}
.strip span {
  font-weight: 800;
  font-size: 20px;
  white-space: nowrap;
  padding-right: 28px;
}
.strip span {
  display: inline-flex;
  align-items: center;
}
.strip i {
  width: 8px;
  height: 8px;
  margin-left: 28px;
  border-radius: 50%;
  background: #4ade80;
}
@keyframes marquee {
  to {
    transform: translateX(-50%);
  }
}

/* ---------- sections ---------- */
.section {
  padding: 110px 0;
}
.head-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}
.num {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: var(--brand);
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}
.head-row h2 {
  font-size: clamp(30px, 4vw, 48px);
  font-weight: 800;
  letter-spacing: -0.04em;
  max-width: 640px;
}
.link-arrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--brand);
}
.link-arrow .icon {
  transition: transform 0.2s;
}
.link-arrow:hover .icon {
  transform: translateX(4px);
}

/* categories mosaic */
.cats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 230px;
  gap: 16px;
}
.cat {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  color: #fff;
  background: var(--surface-3);
}
.cat.tall {
  grid-row: span 2;
}
.cat.wide {
  grid-column: span 2;
}
.cat img {
  position: absolute;
  left: 0;
  top: -15%;
  width: 100%;
  height: 130%;
  object-fit: cover;
  transform: translate3d(0, var(--py, 0px), 0) scale(var(--s, 1));
  transition: scale 0.8s cubic-bezier(0.2, 0.7, 0.2, 1);
  will-change: transform;
}
.cat::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(5, 20, 12, 0.75), rgba(5, 20, 12, 0) 60%);
}
.cat:hover img {
  --s: 1.08;
}
.cat-txt {
  position: absolute;
  left: 22px;
  bottom: 20px;
  right: 70px;
  z-index: 1;
}
.cat-txt h3 {
  font-size: 24px;
  font-weight: 800;
}
.cat-txt span {
  font-size: 14px;
  color: #e5e5ee;
}
.cat-go {
  position: absolute;
  right: 18px;
  bottom: 20px;
  z-index: 1;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff;
  color: #0f1228;
  transform: translateX(10px);
  opacity: 0;
  transition: 0.3s;
}
.cat:hover .cat-go,
.cat:focus-visible .cat-go {
  transform: none;
  opacity: 1;
}

/* how it works */
.how-wrap {
  background: var(--surface);
  border-block: 1px solid var(--border);
  position: relative;
}
.how-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(var(--border-strong) 1px, transparent 1px);
  background-size: 22px 22px;
  opacity: 0.6;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
  pointer-events: none;
}
.how {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}
.how-line {
  position: absolute;
  top: 6px;
  left: 6%;
  width: 88%;
  height: 60px;
}
.how-line path {
  fill: none;
  stroke: var(--brand);
  stroke-width: 2;
  stroke-dasharray: 8 10;
  animation: dash 30s linear infinite;
}
@keyframes dash {
  to {
    stroke-dashoffset: -600;
  }
}
.how-step {
  position: relative;
}
.how-ico {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: var(--brand-50);
  border: 2px solid var(--brand);
  color: var(--brand-700);
  margin-bottom: 22px;
  transition: transform 0.3s;
}
.how-step:hover .how-ico {
  transform: rotate(-6deg) scale(1.06);
}
.how-step h3 {
  font-size: 22px;
  margin-bottom: 8px;
}
.how-step p {
  color: var(--muted);
  max-width: 320px;
}

/* parallax band */
.band {
  position: relative;
  overflow: hidden;
  padding: 140px 0;
  color: #fff;
}
/* photo layer for the band and closing sections; taller than its box so it can drift */
.pbg {
  position: absolute;
  left: 0;
  top: -30%;
  width: 100%;
  height: 160%;
  object-fit: cover;
  transform: translate3d(0, var(--py, 0px), 0);
  will-change: transform;
}
.band-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(5, 20, 12, 0.78), rgba(5, 20, 12, 0.6));
}
.band-in {
  position: relative;
}
.band blockquote {
  margin: 0;
  max-width: 760px;
  font-size: clamp(30px, 4.4vw, 54px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
.band blockquote span {
  display: block;
  margin-top: 20px;
  font-size: clamp(16px, 1.6vw, 20px);
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.55;
  color: #e3f1e7;
  max-width: 600px;
}

/* shops */
.shops-layout {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 28px;
  align-items: stretch;
}
.map-card {
  position: relative;
  min-height: 380px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: linear-gradient(135deg, var(--map-land-a), var(--map-land-b) 55%, var(--map-land-c));
}
.map-card.demo {
  display: block;
  min-height: 480px;
  box-shadow: var(--shadow-lg);
  isolation: isolate;
}
@media (max-width: 1000px) {
  .map-card.demo {
    min-height: 440px;
  }
}
.map-grid {
  position: absolute;
  inset: -20%;
  background:
    linear-gradient(90deg, transparent 47%, var(--map-road) 47%, var(--map-road) 53%, transparent 53%) 0 0 / 160px 160px,
    linear-gradient(0deg, transparent 46%, var(--map-road) 46%, var(--map-road) 54%, transparent 54%) 0 0 / 120px 120px;
  transform: translate3d(0, var(--py, 0px), 0) rotate(-14deg);
}
.m-pin {
  position: absolute;
  width: 30px;
  height: 30px;
  margin: -30px 0 0 -15px;
  border-radius: 50% 50% 50% 0;
  background: var(--c);
  border: 3px solid #fff;
  transform: rotate(-45deg);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
  animation: drop 0.6s var(--pd) cubic-bezier(0.3, 1.6, 0.5, 1) both, bob 3s calc(var(--pd) + 0.6s) ease-in-out infinite;
}
@keyframes drop {
  from {
    transform: translateY(-60px) rotate(-45deg);
    opacity: 0;
  }
}
@keyframes bob {
  50% {
    transform: translateY(-6px) rotate(-45deg);
  }
}
.m-me {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2563eb;
  border: 3px solid #fff;
}
.m-me::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid #2563eb;
  animation: ping 2s ease-out infinite;
}
.map-note {
  position: absolute;
  left: 16px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}
.shop-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.shop-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s, opacity 0.7s;
}
.shop-row.in:hover {
  border-color: var(--brand);
  box-shadow: var(--shadow);
  transform: translateX(4px);
}
/* the demo shop the map is currently routing to */
.shop-row.in.current {
  border-color: #2f80ff;
  box-shadow: 0 0 0 3px rgba(47, 128, 255, 0.18), var(--shadow);
  transform: translateX(6px);
}
.demo-note {
  margin: 2px 4px 0;
  font-size: 12.5px;
  color: var(--muted);
}
.shop-row img {
  width: 76px;
  height: 76px;
  border-radius: 14px;
  object-fit: cover;
  flex: none;
}
.shop-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.shop-meta b {
  font-size: 16px;
}
.shop-meta small {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--muted);
  font-size: 13px;
}
.tag {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 99px;
  background: var(--brand-50);
  color: var(--brand-700);
  white-space: nowrap;
}
.shop-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.shop-side small {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* new products */
.new-wrap {
  padding-top: 0;
}
.pgrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

/* get the app */
.get-app-sec {
  padding-top: 0;
}
.get-app-sec:empty {
  display: none;
}

/* closing */
.closing {
  position: relative;
  overflow: hidden;
  padding: 130px 0;
  color: #fff;
}
.closing-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(5, 20, 12, 0.9), rgba(5, 20, 12, 0.5));
}
.closing-in {
  position: relative;
}
.closing h2 {
  font-size: clamp(32px, 4.6vw, 56px);
  font-weight: 800;
  letter-spacing: -0.04em;
  max-width: 640px;
}
.closing p {
  margin-top: 14px;
  color: #e3f1e7;
  font-size: 18px;
  max-width: 520px;
}
.closing-cta {
  margin-top: 30px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.ghost-light {
  background: transparent;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.45);
}
.ghost-light:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* ---------- responsive ---------- */
/* big desktop monitors: let the hero breathe */
@media (min-width: 1600px) {
  .hero-visual {
    padding-left: 48px;
  }
  .hcard {
    padding: 20px 22px;
  }
}
/* short laptop screens (1366×768, 1280×720 …): keep the whole hero above the fold */
@media (min-width: 961px) and (max-height: 780px) {
  .hero-in {
    padding: 16px 0 70px;
  }
  .lead {
    font-size: 16px;
  }
  .trust {
    margin-top: 14px;
  }
  .hero-visual {
    gap: 12px;
    padding-top: 28px;
  }
  .hcard {
    padding: 12px 16px;
  }
  .sticker {
    width: 92px;
    height: 92px;
  }
}
/* tablets and small laptops: one column, cards hidden */
@media (max-width: 960px) {
  .hero-in {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero-visual {
    display: none;
  }
}
@media (max-width: 1000px) {
  .cats {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 200px;
  }
  .cat.tall {
    grid-row: span 1;
  }
  .shops-layout {
    grid-template-columns: 1fr;
  }
  .pgrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .map-card {
    min-height: 280px;
  }
}
@media (max-width: 720px) {
  .section {
    padding: 72px 0;
  }
  .how {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .how-line {
    display: none;
  }
  .band {
    padding: 90px 0;
  }
  .search .btn {
    padding: 0 14px;
  }
  .underline {
    white-space: normal;
  }
}
/* phones */
@media (max-width: 600px) {
  .hero-in {
    padding: 20px 0 84px;
  }
  .kicker {
    font-size: 12.5px;
  }
  .search {
    padding: 6px 6px 6px 14px;
    border-radius: 14px;
  }
  .search input {
    font-size: 16px;
    height: 42px;
  }
  .search .btn {
    height: 42px;
  }
  .hero-actions {
    width: 100%;
  }
  .hero-actions .btn {
    flex: 1 1 140px;
    height: 50px;
    padding: 0 14px;
  }
  /* popular chips: one swipeable row instead of wrapping */
  .quick {
    width: 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 4px;
  }
  .quick::-webkit-scrollbar {
    display: none;
  }
  .quick a,
  .quick span {
    flex: none;
  }
  .trust {
    font-size: 13px;
    gap: 6px 14px;
  }
  .strip span {
    font-size: 16px;
  }
  .head-row h2 {
    font-size: clamp(26px, 7.5vw, 34px);
  }
  .closing,
  .band {
    padding: 80px 0;
  }
  .closing-cta .btn {
    flex: 1 1 100%;
  }
}
@media (max-width: 560px) {
  .cats {
    grid-template-columns: 1fr;
  }
  .cat.wide {
    grid-column: span 1;
  }
  .shop-side small {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .slide.on,
  .strip-track,
  .how-line path,
  .m-pin,
  .ping::after,
  .m-me::after,
  .underline::after,
  .hcard,
  .sticker {
    animation: none;
  }
}

/* ---------- extra motion ---------- */

/* thin progress bar along the top as you scroll */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 70;
  background: linear-gradient(90deg, var(--brand), #86efac);
  transform: scaleX(var(--sp, 0));
  transform-origin: left;
  pointer-events: none;
}

/* headline lines rise one after another */
.h1-lines .line {
  display: block;
  overflow: hidden;
  padding-bottom: 0.1em;
  margin-bottom: -0.1em;
}
.h1-lines .line > span {
  display: inline-block;
  transform: translateY(110%);
  transition: transform 1s cubic-bezier(0.2, 0.8, 0.2, 1) var(--ld, 0s);
}
.h1-lines.in .line > span {
  transform: none;
}

/* "Find ___": the blank cycles through words, each rising in as the last rises out.
   An invisible copy of the current word stays in the text flow to size the slot. */
.rotator {
  position: relative;
  display: inline-block;
  color: #86efac;
  white-space: nowrap;
  clip-path: inset(-0.05em -0.3em -0.2em -0.3em);
}
.rw-ghost {
  visibility: hidden;
}
.rw {
  position: absolute;
  left: 0;
  bottom: 0;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(85%);
  filter: blur(6px);
  transition: transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s ease, filter 0.5s ease;
}
.rw.on {
  opacity: 1;
  transform: none;
  filter: none;
}
.rw.out {
  opacity: 0;
  transform: translateY(-85%);
  filter: blur(6px);
}

/* light sweeping across the main buttons */
.btn-shine {
  position: relative;
  overflow: hidden;
}
.btn-shine::after {
  content: '';
  position: absolute;
  top: 0;
  left: -60%;
  width: 40%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: skewX(-20deg);
  animation: shine 3.6s ease-in-out 1.5s infinite;
  pointer-events: none;
}
@keyframes shine {
  0%,
  60% {
    left: -60%;
  }
  100% {
    left: 130%;
  }
}

/* second strip, dark, running the other way */
.strip-dark {
  background: #0f1712;
  transform: rotate(1deg);
  margin-top: -6px;
  padding: 11px 0;
  z-index: 1;
}
.strip-dark span {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.strip-dark i {
  background: #86efac;
  opacity: 1;
  width: 6px;
  height: 6px;
}
.strip-dark .strip-track {
  animation-direction: reverse;
  animation-duration: 40s;
}

/* category tiles tilt toward the mouse */
.cat.in {
  transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
}
/* only after the mouse first moves over it, so the staggered entrance stays intact */
.cat.in.tilting {
  transition: transform 0.25s ease-out, opacity 0.7s ease;
  transition-delay: 0s;
}

/* step icons pop in, then the dashed path keeps flowing */
.how-step.in .how-ico {
  animation: pop 0.7s cubic-bezier(0.3, 1.6, 0.5, 1) calc(var(--d, 0ms) + 0.25s) backwards;
}
@keyframes pop {
  from {
    transform: scale(0.3) rotate(-25deg);
    opacity: 0;
  }
}

/* soft drifting colour blobs behind "How it works" */
.how-wrap {
  overflow: hidden;
}
.how-wrap > .container {
  position: relative;
}
.blob {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
  pointer-events: none;
}
.blob-a {
  background: #86efac;
  top: -120px;
  left: -80px;
  animation: drift-a 14s ease-in-out infinite alternate;
}
.blob-b {
  background: #fed7aa;
  bottom: -140px;
  right: -60px;
  animation: drift-b 17s ease-in-out infinite alternate;
}
@keyframes drift-a {
  to {
    transform: translate(140px, 90px) scale(1.2);
  }
}
@keyframes drift-b {
  to {
    transform: translate(-160px, -70px) scale(0.9);
  }
}

/* section numbers slide in beside their headings */
.num {
  animation: none;
}
.head-row:has(.reveal-wipe.in) .num {
  animation: num-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes num-in {
  from {
    opacity: 0;
    transform: translateX(-16px);
  }
}

/* the highlighted shop row breathes while the map routes to it */
.shop-row.in.current img {
  animation: breathe 2.4s ease-in-out infinite;
}
@keyframes breathe {
  50% {
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-progress,
  .blob {
    display: none;
  }
  .rw {
    transition: none;
    filter: none;
  }
  .h1-lines .line > span,
  .reveal-wipe {
    transform: none;
    clip-path: none;
    transition: none;
  }
  .btn-shine::after,
  .how-step.in .how-ico,
  .shop-row.in.current img,
  .head-row:has(.reveal-wipe.in) .num {
    animation: none;
  }
}
</style>
