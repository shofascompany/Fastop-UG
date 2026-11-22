import { ref } from 'vue'

// Shared across the whole app so the location is requested only once.
const location = ref(null)
const status = ref('idle') // idle | loading | ok | error
const errorMsg = ref('')

export function distanceKm(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const fmtKm = (d) => (d == null ? '' : d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`)

export const directionsUrl = (shop) => `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`

export function useGeo() {
  function locate() {
    if (!navigator.geolocation) {
      status.value = 'error'
      errorMsg.value = 'Your browser does not support location.'
      return Promise.resolve(null)
    }
    status.value = 'loading'
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          location.value = { lat: p.coords.latitude, lng: p.coords.longitude }
          status.value = 'ok'
          resolve(location.value)
        },
        (e) => {
          status.value = 'error'
          errorMsg.value = e.code === 1 ? 'Location permission was denied.' : 'Could not get your location.'
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    })
  }

  const distanceTo = (point) => (location.value && point ? distanceKm(location.value, point) : null)

  return { location, status, errorMsg, locate, distanceTo }
}
