<template>
  <span class="logo" :class="{ light }" role="img" aria-label="Fastop">
    <span class="mark" :style="{ width: size + 'px', height: size + 'px' }" v-html="svg" />
    <span v-if="!markOnly" class="text">
      <span class="word" :style="{ fontSize: size * 0.62 + 'px' }">Fast<span class="op">op</span></span>
      <span v-if="tagline" class="tagline" :style="{ fontSize: Math.max(8, size * 0.2) + 'px' }">Fast <i>•</i> Shop <i>•</i> Find <i>•</i> Go</span>
    </span>
  </span>
</template>

<script setup>
// The logo (Uganda map + magnifying glass + cart, on white) lives in src/assets/logo-mark.svg.
// public/favicon.svg and public/logo.svg are copies of it; the original artwork is in branding/.
import raw from '@/assets/logo-mark.svg?raw'

defineProps({
  size: { type: Number, default: 36 },
  markOnly: { type: Boolean, default: false },
  /** Use on dark backgrounds */
  light: { type: Boolean, default: false },
  tagline: { type: Boolean, default: false },
})

// Unique gradient ids so several logos can share a page.
const prefix = 'fx' + Math.random().toString(36).slice(2, 8) + '-'
const svg = raw
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/id="([^"]+)"/g, `id="${prefix}$1"`)
  .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
  .replace('<svg ', '<svg width="100%" height="100%" aria-hidden="true" ')
</script>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.mark {
  display: block;
  flex: none;
  border-radius: 24%;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(22, 163, 74, 0.18), 0 3px 8px -2px rgba(15, 77, 58, 0.25);
}
.mark :deep(svg) {
  display: block;
}
.text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.word {
  font-weight: 800;
  font-style: italic;
  letter-spacing: -0.03em;
  color: #15803d;
}
.op {
  background: linear-gradient(135deg, #22c55e, #86efac);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding-right: 0.08em;
}
.tagline {
  margin-top: 0.4em;
  font-weight: 700;
  font-style: italic;
  letter-spacing: 0.04em;
  color: var(--muted);
  white-space: nowrap;
}
.tagline i {
  font-style: normal;
  color: #22c55e;
  margin: 0 0.12em;
}
.light .word,
:global([data-theme='dark']) .word {
  color: #ffffff;
}
.light .op,
:global([data-theme='dark']) .op {
  background: linear-gradient(135deg, #ecfccb, #86efac);
  -webkit-background-clip: text;
  background-clip: text;
}
.light .tagline {
  color: #bbf7d0;
}
</style>
