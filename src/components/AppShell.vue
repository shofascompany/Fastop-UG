<template>
  <div v-if="auth.user" class="shell" :class="`shell-${theme}`">
    <aside class="sidebar" :class="{ open }">
      <div class="sidebar-head">
        <RouterLink to="/" aria-label="Fastop home"><AppLogo :size="34" :light="theme === 'dark'" /></RouterLink>
        <button class="btn-icon only-mobile" @click="open = false" aria-label="Close menu"><AppIcon name="x" /></button>
      </div>
      <div class="sidebar-tag">{{ label }}</div>
      <slot name="sidebar-top" />
      <nav class="side-nav">
        <RouterLink v-for="item in nav" :key="item.label" :to="item.to" class="side-link" active-class="active" @click="open = false">
          <AppIcon :name="item.icon" :size="19" />
          <span>{{ item.label }}</span>
          <span v-if="item.count" class="count">{{ item.count }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar-foot">
        <slot name="sidebar-bottom" />
        <div class="user-card">
          <div class="avatar">{{ initials(auth.user?.name) }}</div>
          <div class="meta">
            <strong class="truncate">{{ auth.user?.name }}</strong>
            <small class="truncate">{{ auth.user?.email }}</small>
          </div>
          <button class="btn-icon sm" title="Sign out" @click="logout"><AppIcon name="logout" :size="18" /></button>
        </div>
      </div>
    </aside>
    <div v-if="open" class="backdrop" @click="open = false"></div>

    <div class="main">
      <header class="topbar">
        <button class="btn-icon only-mobile" @click="open = true" aria-label="Open menu"><AppIcon name="menu" /></button>
        <div class="topbar-title">{{ $route.meta.title }}</div>
        <div class="topbar-right"><slot name="topbar" /><ThemeToggle /></div>
      </header>
      <div v-if="db.settings.announcement" class="announce"><AppIcon name="bell" :size="16" /> {{ db.settings.announcement }}</div>
      <main class="content">
        <slot><PageView /></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLogo from './AppLogo.vue'
import AppIcon from './AppIcon.vue'
import PageView from './PageView.vue'
import ThemeToggle from './ThemeToggle.vue'
import { useAuth } from '@/stores/auth'
import { useDb } from '@/stores/db'
import { initials } from '@/utils/format'
import { toast } from '@/stores/toast'

defineProps({
  label: { type: String, required: true },
  nav: { type: Array, required: true },
  theme: { type: String, default: 'light' },
})

const open = ref(false)
const auth = useAuth()
const db = useDb()
const router = useRouter()

function logout() {
  auth.logout({ byUser: true })
  toast('You have been signed out', 'info')
  router.replace({ name: 'auth' })
}
</script>
