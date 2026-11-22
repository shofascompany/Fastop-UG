<template>
  <!-- A RouterView that plays each page's own entrance animation (route meta.transition). -->
  <RouterView v-slot="{ Component, route }">
    <Transition
      :name="`pt-${route.meta.transition || 'fade'}`"
      :enter-active-class="`pt-${route.meta.transition || 'fade'}-enter-active pt-enter-active`"
      mode="out-in"
      appear
    >
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>
