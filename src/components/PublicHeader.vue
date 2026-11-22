<template>
  <header class="pub-nav" :class="{ scrolled, overlay: overlay && !scrolled && !open }">
    <div class="container pub-in">
      <RouterLink to="/" aria-label="Fastop home"><AppLogo :size="44" :light="overlay && !scrolled && !open" /></RouterLink>
      <nav class="pub-links" :class="{ open }">
        <a href="/#categories" @click="open = false">Categories</a>
        <a href="/#how" @click="open = false">How it works</a>
        <a href="/#shops" @click="open = false">Shops</a>
        <RouterLink to="/about" @click="open = false">About</RouterLink>
        <RouterLink v-if="auth.user" :to="auth.homeRoute" class="btn btn-primary btn-sm mobile-cta">Open app</RouterLink>
        <RouterLink v-else :to="{ name: 'auth' }" class="btn btn-primary btn-sm mobile-cta">Sign in</RouterLink>
      </nav>
      <div class="pub-cta">
        <template v-if="auth.user">
          <RouterLink :to="auth.homeRoute" class="btn btn-primary">Open app <AppIcon name="arrowRight" :size="16" /></RouterLink>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'auth' }" class="btn btn-outline login-btn"><AppIcon name="lock" :size="16" /> Sign in</RouterLink>
          <RouterLink :to="{ name: 'explore-home' }" class="btn btn-primary">Start browsing</RouterLink>
        </template>
      </div>
      <RouterLink v-if="!auth.user" :to="{ name: 'auth' }" class="btn btn-outline btn-sm login-btn login-mobile"><AppIcon name="lock" :size="15" /> Sign in</RouterLink>
      <button class="btn-icon burger" @click="open = !open" aria-label="Menu"><AppIcon :name="open ? 'x' : 'menu'" /></button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AppLogo from './AppLogo.vue'
import AppIcon from './AppIcon.vue'
import { useAuth } from '@/stores/auth'

defineProps({ overlay: { type: Boolean, default: false } })

const auth = useAuth()
const open = ref(false)
const scrolled = ref(false)
const onScroll = () => (scrolled.value = window.scrollY > 8)
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.pub-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  transition: background 0.2s, box-shadow 0.2s;
}
.pub-nav.scrolled {
  background: var(--glass);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 var(--border);
}
.pub-in {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.pub-links {
  display: flex;
  gap: 28px;
  font-weight: 600;
  font-size: 14.5px;
  color: var(--text-2);
}
.pub-links a:hover {
  color: var(--brand);
}
/* sitting on top of a photo: white text until the page scrolls */
.overlay .pub-links,
.overlay .burger {
  color: #fff;
}
.overlay .pub-links a:hover {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 6px;
}
.overlay .btn-ghost {
  color: #fff;
}
.overlay .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.14);
}
/* near-black outline: a small dark touch next to the green "Start browsing" */
.login-btn {
  border-color: var(--text);
  color: var(--text);
  font-weight: 700;
}
.login-btn:hover {
  background: var(--hover) !important;
}
.overlay .login-btn {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.7);
  color: #fff;
  backdrop-filter: blur(6px);
}
.overlay .login-btn:hover {
  background: rgba(255, 255, 255, 0.24);
}
.login-mobile {
  display: none !important;
}
.pub-cta {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
.burger,
.mobile-cta {
  display: none !important;
}
@media (max-width: 860px) {
  .pub-cta {
    display: none;
  }
  .login-mobile {
    display: inline-flex !important;
    margin-left: auto;
  }
  .burger {
    display: inline-grid !important;
  }
  .pub-in > a:first-child + nav + .pub-cta + .burger {
    margin-left: auto;
  }
  .pub-links {
    display: none;
    position: absolute;
    top: 72px;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px 18px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .pub-links.open {
    display: flex;
  }
  .pub-links a {
    padding: 10px 4px;
  }
  .mobile-cta {
    display: inline-flex !important;
    margin-top: 8px;
    color: #fff !important;
  }
  .pub-in {
    gap: 10px;
    height: 64px;
  }
  .pub-links {
    top: 64px;
  }
}
/* small phones: drop the tagline so logo, Login and menu fit on one line */
@media (max-width: 400px) {
  .pub-in :deep(.tagline) {
    display: none;
  }
}
</style>
