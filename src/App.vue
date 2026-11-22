<template>
  <RouterView v-slot="{ Component, route }">
    <Transition
      :name="`pt-${topMeta(route).transition || 'fade'}`"
      :enter-active-class="`pt-${topMeta(route).transition || 'fade'}-enter-active pt-enter-active`"
      mode="out-in"
      appear
    >
      <component :is="Component" :key="route.matched[0]?.path || route.path" />
    </Transition>
  </RouterView>
  <ToastHost />
  <InstallBanner />
  <Transition name="fade">
    <AppLoader v-if="busy" variant="overlay" text="Loading" />
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ToastHost from '@/components/ToastHost.vue'
import InstallBanner from '@/components/InstallBanner.vue'
import AppLoader from '@/components/AppLoader.vue'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const auth = useAuth()

// The top-level page (or layout) decides the outer animation.
const topMeta = (route) => route.matched[0]?.meta || {}

// The first page is covered by the instant start-up screen in index.html.
// After that, the rolling-cart loader appears only if a page takes more than 300 ms.
const busy = ref(false)
let timer = null
router.beforeEach((to) => {
  clearTimeout(timer)
  if (to.name === 'landing') return // the landing page is in the main bundle: never a loader in front of it
  timer = setTimeout(() => (busy.value = true), 300)
})
const done = () => {
  clearTimeout(timer)
  busy.value = false
}
router.afterEach(done)
router.onError(done)

// If the session ends on its own (token expired, account suspended) while a protected page is open,
// send them to sign in and back here afterwards. A deliberate "Sign out" navigates by itself.
watch(
  () => auth.user,
  (u) => {
    if (u || auth.signedOutByUser) return
    const r = router.currentRoute.value
    if (r.matched.some((m) => m.meta.roles)) router.replace({ name: 'auth', query: { redirect: r.fullPath } })
  },
  // immediate: the session check can finish (and fail) during start-up, before this screen exists
  { immediate: true },
)
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
