<template>
  <div class="about">
    <PublicHeader />

    <section class="container about-hero">
      <AppLogo :size="120" mark-only />
      <h1>About Fastop</h1>
      <p>
        We started Fastop because finding out which shop has what you need is harder than it should be. Supermarkets, boutiques, phone shops,
        hardware stores, pharmacies: usually you only find out once you walk in. Fastop lets any shop show what it stocks, so you can check before you go.
      </p>
    </section>

    <section class="container about-grid">
      <div class="card card-pad">
        <h3><AppIcon name="pin" /> Every shop on the map</h3>
        <p>Every shop is on the map, so you can see how far it is and get directions.</p>
      </div>
      <div class="card card-pad">
        <h3><AppIcon name="tag" /> No price tags</h3>
        <p>Prices change often and differ from shop to shop. We show what's in stock and leave the price to you and the shop.</p>
      </div>
      <div class="card card-pad">
        <h3><AppIcon name="shield" /> Checked shops</h3>
        <p>We look at every shop before it goes live, and take down listings that shouldn't be there.</p>
      </div>
    </section>

    <section id="faq" class="container block">
      <h2>Questions shoppers ask</h2>
      <div class="faq">
        <details v-for="q in faq" :key="q.q" class="card">
          <summary>{{ q.q }} <AppIcon name="chevronDown" :size="18" /></summary>
          <p>{{ q.a }}</p>
        </details>
      </div>
    </section>

    <section class="container block contact card card-pad">
      <div>
        <h2>Get in touch</h2>
        <p class="muted">Something not working, or a listing looks wrong? Message us on WhatsApp, call or email.</p>
      </div>
      <div class="row wrap">
        <a
          v-for="c in CONTACT_LINKS"
          :key="c.id"
          :href="c.href"
          class="btn btn-outline contact-btn"
          :target="c.external ? '_blank' : undefined"
          :rel="c.external ? 'noopener' : undefined"
        >
          <BrandIcon :name="c.id" :size="26" /> {{ c.id === 'email' || c.id === 'instagram' ? c.value : c.label }}
        </a>
      </div>
    </section>

    <PublicFooter />
  </div>
</template>

<script setup>
import PublicHeader from '@/components/PublicHeader.vue'
import PublicFooter from '@/components/PublicFooter.vue'
import AppLogo from '@/components/AppLogo.vue'
import AppIcon from '@/components/AppIcon.vue'
import BrandIcon from '@/components/BrandIcon.vue'
import { CONTACT_LINKS } from '@/data/contact'

const faq = [
  { q: 'What do I get with an account?', a: 'You can save products to come back to, message shops about an item and see their replies in one inbox. Signing up takes an email and a password.' },
  { q: 'Why can\'t I see prices?', a: 'Shops change their prices often, so we don\'t list them. Message the shop, give them a call or drop in and ask.' },
  { q: 'Is it really in stock?', a: 'Shops update their stock as they sell, so what you see is usually current. If you\'re making a special trip, message or call the shop first.' },
  { q: 'Can I buy through Fastop?', a: 'No. Fastop helps you find the shop. You pay the shop directly when you pick the item up.' },
  { q: 'How do I get to a shop?', a: 'Open the shop or product page and tap Directions. It opens your maps app with the route.' },
]
</script>

<style scoped>
.about {
  background: var(--bg);
}
.about-hero {
  text-align: center;
  max-width: 760px;
  padding: 56px 0 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.about-hero h1 {
  font-size: clamp(34px, 4.5vw, 52px);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.about-hero p {
  font-size: 17px;
  color: var(--text-2);
}
.about-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.about-grid h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--brand-700);
}
.about-grid p {
  color: var(--text-2);
}
.block {
  margin-top: 64px;
}
.block h2 {
  font-size: 28px;
  margin-bottom: 20px;
  letter-spacing: -0.03em;
}
.brand {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 40px;
  align-items: center;
  padding: 32px 40px;
  background: radial-gradient(400px 260px at 10% 50%, var(--brand-50), transparent 70%), var(--surface);
}
.brand-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.brand-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.brand-list p {
  color: var(--muted);
  font-size: 14px;
  margin-top: 2px;
}
.sw {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  color: #fff;
  flex: none;
}
.sw.speed {
  background: var(--accent-50);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  gap: 3px;
  padding: 0 8px;
}
.sw.speed i {
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(90deg, transparent, var(--accent));
  width: 70%;
}
.sw.speed i:nth-child(2) {
  width: 100%;
}
@media (max-width: 860px) {
  .brand {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 24px;
  }
  .brand-list {
    grid-template-columns: 1fr;
  }
}
.faq {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.faq details {
  padding: 0 20px;
}
.faq summary {
  list-style: none;
  cursor: pointer;
  padding: 18px 0;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.faq summary::-webkit-details-marker {
  display: none;
}
.faq details[open] summary .icon {
  transform: rotate(180deg);
}
.faq p {
  padding-bottom: 18px;
  color: var(--text-2);
}
.contact-btn {
  height: 46px;
  padding-left: 8px;
  gap: 10px;
}
.contact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 80px;
}
.contact h2 {
  margin-bottom: 4px;
}
@media (max-width: 860px) {
  .about-grid {
    grid-template-columns: 1fr;
  }
}
</style>
