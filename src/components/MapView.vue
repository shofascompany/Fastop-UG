<template>
  <div class="map-view" :style="{ height }">
    <div ref="el" class="map-canvas"></div>
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import { escapeHtml } from '@/utils/format'
import { iconSvg } from '@/utils/icons'
import { DEFAULT_CENTER } from '@/data/seed'

const props = defineProps({
  /** [{ id, lat, lng, color, icon, title, popup }] */
  markers: { type: Array, default: () => [] },
  center: { type: Array, default: () => DEFAULT_CENTER },
  zoom: { type: Number, default: 14 },
  height: { type: String, default: '420px' },
  /** Click on the map to choose a location */
  pickable: { type: Boolean, default: false },
  picked: { type: Object, default: null },
  userLocation: { type: Object, default: null },
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['pick', 'select'])

const el = ref(null)
let map = null
let markerLayer = null
let userMarker = null
let pickMarker = null
let lastKey = ''

function pinIcon(color, icon, active) {
  return L.divIcon({
    className: 'fx-pin-wrap',
    html: `<div class="fx-pin${active ? ' active' : ''}" style="--c:${escapeHtml(color)}"><span>${iconSvg(icon || 'store', 15, 2.4)}</span></div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 41],
    popupAnchor: [0, -36],
  })
}

function fit() {
  const pts = props.markers.map((m) => [m.lat, m.lng])
  if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 15 })
  else if (pts.length === 1) map.setView(pts[0], props.zoom)
}

function drawMarkers() {
  if (!map) return
  markerLayer.clearLayers()
  props.markers.forEach((m) => {
    const active = m.id === props.selectedId
    const mk = L.marker([m.lat, m.lng], {
      icon: pinIcon(m.color || '#16A34A', m.icon, active),
      title: m.title || '',
      zIndexOffset: active ? 1000 : 0,
    })
    if (m.popup) mk.bindPopup(m.popup)
    mk.on('click', () => emit('select', m.id))
    markerLayer.addLayer(mk)
  })
  const key = props.markers.map((m) => m.id).join('|')
  if (key !== lastKey) {
    lastKey = key
    if (!props.pickable) fit()
  }
}

function drawUser() {
  if (!map) return
  userMarker?.remove()
  userMarker = null
  if (props.userLocation) {
    userMarker = L.circleMarker([props.userLocation.lat, props.userLocation.lng], {
      radius: 9,
      color: '#fff',
      weight: 3,
      fillColor: '#2F80FF',
      fillOpacity: 1,
    })
      .bindTooltip('You are here')
      .addTo(map)
  }
}

function drawPick() {
  if (!map) return
  if (!props.picked) {
    pickMarker?.remove()
    pickMarker = null
    return
  }
  const ll = [props.picked.lat, props.picked.lng]
  if (!pickMarker) {
    pickMarker = L.marker(ll, { icon: pinIcon('#16A34A', 'store', true), draggable: true }).addTo(map)
    pickMarker.on('dragend', () => {
      const p = pickMarker.getLatLng()
      emit('pick', { lat: p.lat, lng: p.lng })
    })
  } else pickMarker.setLatLng(ll)
}

onMounted(() => {
  const start = props.picked ? [props.picked.lat, props.picked.lng] : props.center
  map = L.map(el.value, { zoomControl: true }).setView(start, props.zoom)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  if (props.pickable) map.on('click', (e) => emit('pick', { lat: e.latlng.lat, lng: e.latlng.lng }))
  drawMarkers()
  drawUser()
  drawPick()
  setTimeout(() => map && map.invalidateSize(), 200)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

watch(() => [props.markers, props.selectedId], drawMarkers, { deep: true })
watch(() => props.userLocation, drawUser, { deep: true })
watch(() => props.picked, drawPick, { deep: true })

defineExpose({
  flyTo: (latlng, zoom = 15) => map?.flyTo(latlng, zoom, { duration: 0.8 }),
  fit: () => map && fit(),
})
</script>

<style scoped>
.map-view {
  position: relative;
  isolation: isolate;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface-3);
}
.map-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
}
</style>
