<template>
  <div class="nf">
    <AppLogo :size="48" />
    <h1>404</h1>
    <p>We couldn't find that page.</p>
    <div class="row">
      <RouterLink to="/" class="btn btn-outline">Go home</RouterLink>
      <RouterLink v-if="auth.user && auth.user.role !== 'customer'" :to="auth.homeRoute" class="btn btn-outline">Open my dashboard</RouterLink>
      <RouterLink :to="{ name: 'explore-home' }" class="btn btn-primary">Browse products</RouterLink>
    </div>
  </div>
</template>

<script setup>
import AppLogo from '@/components/AppLogo.vue'
import { useAuth } from '@/stores/auth'
const auth = useAuth()
</script>

<style scoped>
.nf {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  padding: 24px;
}
h1 {
  font-size: 96px;
  font-weight: 800;
  letter-spacing: -0.05em;
  background: linear-gradient(90deg, var(--brand), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
p {
  color: var(--muted);
  margin-bottom: 8px;
}
</style>
