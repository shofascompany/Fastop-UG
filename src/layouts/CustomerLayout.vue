<template>
  <div class="cx">
    <header class="cx-nav">
      <div class="container cx-nav-in">
        <RouterLink :to="{ name: 'explore-home' }" aria-label="Fastop discover"><AppLogo :size="32" /></RouterLink>
        <nav class="cx-links">
          <RouterLink v-for="l in links" :key="l.label" :to="l.to" class="cx-link" :active-class="l.exact ? '' : 'active'" exact-active-class="active">
            <AppIcon :name="l.icon" :size="17" /> {{ l.label }}
          </RouterLink>
        </nav>
        <div class="cx-right">
          <ThemeToggle />
          <template v-if="auth.user">
            <RouterLink v-if="auth.user.role !== 'customer'" :to="auth.homeRoute" class="btn btn-soft btn-sm">
              <AppIcon :name="auth.user.role === 'admin' ? 'shield' : 'store'" :size="16" />
              <span class="hide-sm">{{ auth.user.role === 'admin' ? 'Control Panel' : 'My shop' }}</span>
            </RouterLink>
            <div class="cx-user">
              <div class="avatar">{{ initials(auth.user.name) }}</div>
              <span class="hide-sm strong small">{{ auth.user.name.split(' ')[0] }}</span>
            </div>
            <button class="btn-icon" title="Sign out" @click="logout"><AppIcon name="logout" :size="19" /></button>
          </template>
          <RouterLink v-else :to="{ name: 'auth', query: { redirect: route.fullPath } }" class="btn btn-primary btn-sm">Sign in</RouterLink>
        </div>
      </div>
    </header>

    <div v-if="db.settings.announcement" class="announce"><div class="container row"><AppIcon name="bell" :size="16" /> {{ db.settings.announcement }}</div></div>

    <main class="container cx-main">
      <PageView />
    </main>

    <footer class="cx-foot">
      <div class="container">
        <InstallCard compact class="cx-install" />
      </div>
      <div class="container row between wrap">
        <AppLogo :size="26" />
        <div class="cx-social">
          <a
            v-for="c in CONTACT_LINKS"
            :key="c.id"
            :href="c.href"
            :aria-label="`${c.label}: ${c.value}`"
            :title="`${c.label}: ${c.value}`"
            :target="c.external ? '_blank' : undefined"
            :rel="c.external ? 'noopener' : undefined"
          >
            <BrandIcon :name="c.id" :size="34" />
          </a>
        </div>
        <span class="muted small">Prices are shared in-store. Contact a shop or visit to buy. © {{ year }} Fastop</span>
      </div>
    </footer>

    <nav class="cx-tabs">
      <RouterLink v-for="l in links" :key="l.label" :to="l.to" class="cx-tab" :active-class="l.exact ? '' : 'active'" exact-active-class="active">
        <AppIcon :name="l.icon" :size="21" />
        <span>{{ l.short || l.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'
import AppIcon from '@/components/AppIcon.vue'
import PageView from '@/components/PageView.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import InstallCard from '@/components/InstallCard.vue'
import BrandIcon from '@/components/BrandIcon.vue'
import { CONTACT_LINKS } from '@/data/contact'
import { useAuth } from '@/stores/auth'
import { useDb } from '@/stores/db'
import { initials } from '@/utils/format'
import { toast } from '@/stores/toast'

const auth = useAuth()
const db = useDb()
const router = useRouter()
const route = useRoute()
const year = new Date().getFullYear()

const replies = computed(() => db.enquiries.filter((e) => e.customerId === auth.user?.id && e.status === 'replied').length)

const links = computed(() => [
  { label: 'Discover', icon: 'home', to: { name: 'explore-home' }, exact: true }, // /explore prefixes every page, so match it exactly
  { label: 'Products', icon: 'box', to: { name: 'explore-products' } },
  { label: 'Shops', icon: 'store', to: { name: 'explore-shops' } },
  { label: 'Map', icon: 'map', to: { name: 'explore-map' } },
  { label: 'Saved', icon: 'heart', to: { name: 'explore-saved' } },
  { label: 'Enquiries', short: 'Inbox', icon: 'message', to: { name: 'explore-enquiries' }, count: replies.value },
])

function logout() {
  auth.logout({ byUser: true })
  toast('You have been signed out', 'info')
  router.replace({ name: 'explore-home' })
}
</script>

<style scoped>
.cx {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}
.cx-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--glass);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.cx-nav-in {
  height: 68px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.cx-links {
  display: flex;
  gap: 4px;
}
.cx-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-2);
}
.cx-link:hover {
  background: var(--surface-2);
}
.cx-link.active {
  color: var(--accent);
  background: var(--accent-50);
}
.cx-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.cx-user {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cx-main {
  flex: 1;
  padding: 28px 0 48px;
}
.cx-foot {
  border-top: 1px solid var(--border);
  padding: 20px 0;
  background: var(--surface);
}
.cx-install {
  margin-bottom: 18px;
}
.cx-social {
  display: flex;
  gap: 8px;
}
.cx-social a :deep(.brand-ico) {
  transition: transform 0.2s;
}
.cx-social a:hover :deep(.brand-ico) {
  transform: translateY(-2px);
}
.cx-tabs {
  display: none;
}
@media (max-width: 1000px) {
  .cx-links {
    display: none;
  }
}
@media (max-width: 1000px) {
  .cx-tabs {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 60;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
  }
  .cx-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    padding: 4px 0;
  }
  .cx-tab.active {
    color: var(--accent);
  }
  .cx {
    padding-bottom: 68px;
  }
}
@media (max-width: 560px) {
  .hide-sm {
    display: none;
  }
}
</style>
