<template>
  <div ref="root" class="map-demo">
    <div ref="el" class="md-map"></div>

    <div class="md-top">
      <span class="md-steps">
        <i v-for="(t, i) in DEMO_TRIPS" :key="t.id" :class="{ on: i === idx }"></i>
      </span>
    </div>

    <Transition name="card" mode="out-in">
      <div :key="trip.id" class="md-card">
        <div class="mc-head">
          <span class="mc-ico" :style="{ background: cat.color }"><AppIcon :name="cat.icon" :size="22" :stroke="2.2" /></span>
          <div class="mc-title">
            <b>{{ trip.name }}</b>
            <small>{{ cat.label }} · {{ trip.address }}</small>
          </div>
          <span class="mc-open">{{ trip.hours }}</span>
        </div>
        <div class="mc-meta">
          <span><AppIcon name="navigation" :size="14" /> {{ trip.distance }}</span>
          <span><AppIcon name="user" :size="14" /> {{ trip.walk }}</span>
          <span class="mc-stock"><AppIcon name="check" :size="14" /> {{ trip.stock }}</span>
        </div>
        <div class="mc-actions">
          <span class="mc-btn primary"><AppIcon name="navigation" :size="15" /> Directions</span>
          <span class="mc-btn"><AppIcon name="phone" :size="15" /> Call</span>
          <span class="mc-btn"><AppIcon name="message" :size="15" /> Ask</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import AppIcon from './AppIcon.vue'
import { iconSvg } from '@/utils/icons'
import { catById } from '@/data/categories'
import { DEMO_ME, DEMO_TRIPS, DEMO_SHOPS } from '@/data/mapDemo'

const STEP_MS = 6500

const root = ref(null)
const el = ref(null)
const idx = ref(0)
const trip = computed(() => DEMO_TRIPS[idx.value])
const cat = computed(() => catById(trip.value.category))

let map = null
let timer = null
let io = null
let routeLayer = null
const tripMarkers = {}
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function pin(category, name, { active = false, small = false } = {}) {
  const c = catById(category)
  return L.divIcon({
    className: 'md-pin-wrap',
    html: `<div class="md-pin${active ? ' active' : ''}${small ? ' small' : ''}" style="--c:${c.color}">
             <span class="md-dot">${iconSvg(c.icon, small ? 12 : 14, 2.4)}</span>
             <span class="md-label">${name}</span>
           </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function drawRoute() {
  routeLayer?.remove()
  const t = trip.value
  const casing = L.polyline(t.route, { color: '#ffffff', weight: 9, opacity: 0.9, lineCap: 'round', lineJoin: 'round', className: 'md-route-case' })
  const line = L.polyline(t.route, { color: '#2f80ff', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round', className: 'md-route' })
  routeLayer = L.layerGroup([casing, line]).addTo(map)

  // Draw the route from you to the shop
  if (!reduce) {
    for (const p of [casing, line]) {
      const path = p.getElement()
      if (!path) continue
      const len = path.getTotalLength()
      path.style.transition = 'none'
      path.style.strokeDasharray = `${len} ${len}`
      path.style.strokeDashoffset = `${len}`
      path.getBoundingClientRect()
      path.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.6, 0, 0.3, 1)'
      path.style.strokeDashoffset = '0'
    }
  }

  for (const d of DEMO_TRIPS) tripMarkers[d.id].setIcon(pin(d.category, d.name, { active: d.id === t.id }))
}

const emit = defineEmits(['change'])

function next() {
  idx.value = (idx.value + 1) % DEMO_TRIPS.length
  emit('change', idx.value)
  drawRoute()
}

function build() {
  map = L.map(el.value, {
    zoomControl: false,
    attributionControl: true,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
  })
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
  }).addTo(map)
  map.attributionControl.setPrefix(false)

  const all = [DEMO_ME, ...DEMO_TRIPS.map((t) => t.pos), ...DEMO_SHOPS.map((s) => s.pos)]
  // Leave room at the bottom for the details card
  map.fitBounds(L.latLngBounds(all), { paddingTopLeft: [30, 50], paddingBottomRight: [30, 170] })

  for (const s of DEMO_SHOPS) L.marker(s.pos, { icon: pin(s.category, s.name, { small: true }), interactive: false }).addTo(map)
  for (const t of DEMO_TRIPS) tripMarkers[t.id] = L.marker(t.pos, { icon: pin(t.category, t.name), interactive: false, zIndexOffset: 500 }).addTo(map)

  L.marker(DEMO_ME, {
    icon: L.divIcon({ className: 'md-pin-wrap', html: '<div class="md-me"><span></span><b>You</b></div>', iconSize: [0, 0] }),
    interactive: false,
    zIndexOffset: 1000,
  }).addTo(map)

  drawRoute()
  if (!reduce) timer = setInterval(next, STEP_MS)
}

onMounted(() => {
  // Only load satellite tiles once the preview is about to be seen
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        build()
      }
    },
    { rootMargin: '200px' },
  )
  io.observe(root.value)
})

onBeforeUnmount(() => {
  io?.disconnect()
  clearInterval(timer)
  map?.remove()
})
</script>

<style scoped>
.map-demo {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #2b3a2f;
}
.md-map {
  position: absolute;
  inset: 0;
}
.md-top {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 500;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  pointer-events: none;
}
.md-steps {
  display: flex;
  gap: 5px;
}
.md-steps i {
  width: 18px;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.5);
  transition: width 0.3s, background 0.3s;
}
.md-steps i.on {
  width: 30px;
  background: #fff;
}

/* details card */
.md-card {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 500;
  padding: 14px;
  border-radius: 18px;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}
.mc-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mc-ico {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: #fff;
  flex: none;
}
.mc-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.mc-title b {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mc-title small {
  color: var(--muted);
  font-size: 12.5px;
}
.mc-open {
  flex: none;
  font-size: 12px;
  font-weight: 700;
  color: var(--success);
  background: var(--success-50);
  padding: 4px 9px;
  border-radius: 99px;
}
.mc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 10px 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
}
.mc-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.mc-stock {
  color: var(--success);
}
.mc-actions {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 8px;
}
.mc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid var(--border);
  color: var(--text);
}
.mc-btn.primary {
  background: #2f80ff;
  border-color: #2f80ff;
  color: #fff;
}
.card-enter-active,
.card-leave-active {
  transition: transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s;
}
.card-enter-from {
  transform: translateY(30px);
  opacity: 0;
}
.card-leave-to {
  transform: translateY(14px);
  opacity: 0;
}
@media (max-width: 480px) {
  .mc-stock {
    display: none;
  }
  .mc-open {
    display: none;
  }
}
</style>

<!-- Leaflet builds these markers outside Vue, so their styles must be global -->
<style>
.md-pin-wrap {
  background: none !important;
  border: none !important;
}
.md-pin {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  transform: translate(-15px, -15px);
  white-space: nowrap;
  pointer-events: none;
}
.md-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--c);
  border: 2.5px solid #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45);
  transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.md-label {
  padding: 3px 8px;
  border-radius: 7px;
  font: 700 11.5px/1.3 var(--font);
  color: #fff;
  background: rgba(10, 14, 12, 0.75);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
.md-pin.small {
  transform: translate(-11px, -11px);
}
.md-pin.small .md-dot {
  width: 22px;
  height: 22px;
  border-width: 2px;
}
.md-pin.small .md-label {
  font-size: 10.5px;
  padding: 2px 6px;
  background: rgba(10, 14, 12, 0.6);
}
.md-pin.active .md-dot {
  transform: scale(1.35);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.35), 0 6px 14px rgba(0, 0, 0, 0.5);
}
.md-pin.active .md-label {
  background: #fff;
  color: #0f1228;
  font-size: 12.5px;
}
.md-me {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-10px, -10px);
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}
.md-me span {
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2f80ff;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
}
.md-me span::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 3px solid #2f80ff;
  animation: md-ping 2s ease-out infinite;
}
.md-me b {
  padding: 3px 8px;
  border-radius: 7px;
  font: 800 12px/1.3 var(--font);
  color: #fff;
  background: #2f80ff;
}
@keyframes md-ping {
  to {
    transform: scale(3);
    opacity: 0;
  }
}
/* satellite imagery must not be inverted by the app's dark-mode map filter */
[data-theme='dark'] .map-demo .leaflet-tile-pane {
  filter: none;
}
.map-demo .leaflet-control-attribution {
  font-size: 9px;
  background: rgba(255, 255, 255, 0.6);
}
@media (prefers-reduced-motion: reduce) {
  .md-me span::after {
    animation: none;
  }
}
</style>
