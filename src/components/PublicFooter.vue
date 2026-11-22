<template>
  <footer class="pub-foot">
    <div v-if="!hideInstall" class="container">
      <InstallCard class="foot-install" />
    </div>

    <div class="container foot-grid">
      <div class="foot-brand">
        <AppLogo :size="44" light />
        <p>Supermarkets, boutiques, phone shops, pharmacies and more. See what they have in stock, then go and get it.</p>
      </div>
      <div>
        <h4>Browse</h4>
        <a href="/#categories">Categories</a>
        <a href="/#shops">Shops</a>
        <a href="/#new">New on the shelves</a>
        <a href="/#how">How it works</a>
      </div>
      <div>
        <h4>Your account</h4>
        <RouterLink :to="{ name: 'auth', query: { role: 'customer' } }">Create an account</RouterLink>
        <RouterLink :to="{ name: 'auth' }">Sign in</RouterLink>
        <RouterLink :to="{ name: 'explore-saved' }">Saved products</RouterLink>
        <RouterLink to="/about">About Fastop</RouterLink>
        <RouterLink to="/about#faq">FAQ</RouterLink>
      </div>
      <div class="contact">
        <h4>Contact us</h4>
        <a
          v-for="c in CONTACT_LINKS"
          :key="c.id"
          :href="c.href"
          class="c-row"
          :target="c.external ? '_blank' : undefined"
          :rel="c.external ? 'noopener' : undefined"
        >
          <BrandIcon :name="c.id" :size="34" />
          <span class="c-txt"><small>{{ c.label }}</small>{{ c.value }}</span>
        </a>
      </div>
    </div>

    <div class="container foot-bottom">
      <span>© {{ year }} Fastop. All rights reserved.</span>
    </div>
  </footer>
</template>

<script setup>
import AppLogo from './AppLogo.vue'
import BrandIcon from './BrandIcon.vue'
import InstallCard from './InstallCard.vue'
import { CONTACT_LINKS } from '@/data/contact'

// The landing page shows its own large install section, so it hides the footer copy.
defineProps({ hideInstall: { type: Boolean, default: false } })

const year = new Date().getFullYear()
</script>

<style scoped>
.pub-foot {
  background: radial-gradient(600px 300px at 0% 0%, rgba(134, 239, 172, 0.14), transparent 70%), var(--footer-bg);
  color: #9cc5ab;
  padding: 48px 0 24px;
}
.foot-install {
  margin-bottom: 48px;
}
.foot-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.3fr;
  gap: 32px;
}
.foot-brand p {
  margin-top: 14px;
  max-width: 340px;
  font-size: 14px;
}
h4 {
  color: #fff;
  font-size: 14px;
  margin-bottom: 12px;
}
.foot-grid a {
  display: block;
  font-size: 14px;
  padding: 4px 0;
}
.foot-grid a:hover {
  color: #fff;
}
.contact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.foot-grid .c-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}
.c-row:hover :deep(.brand-ico) {
  transform: scale(1.08);
}
.c-txt {
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: #e6f4ea;
  font-weight: 600;
  overflow-wrap: anywhere;
  line-height: 1.3;
}
.c-txt small {
  color: #9cc5ab;
  font-weight: 500;
  font-size: 12px;
}
.foot-bottom {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--footer-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
}
@media (max-width: 900px) {
  .foot-grid {
    grid-template-columns: 1fr 1fr;
  }
  .foot-brand {
    grid-column: span 2;
  }
}
@media (max-width: 520px) {
  .foot-grid {
    grid-template-columns: 1fr;
  }
  .foot-brand {
    grid-column: auto;
  }
}
</style>
