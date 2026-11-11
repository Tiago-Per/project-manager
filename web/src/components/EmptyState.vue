<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>

<template>
  <section
    class="flex flex-1 flex-col items-center justify-center rounded-sm bg-white px-6 py-16 text-center"
  >
    <h2 class="text-heading text-title">{{ title }}</h2>
    <p class="text-muted mt-4 max-w-md leading-5.5">{{ description }}</p>
    <div v-if="$slots.default" class="mt-6">
      <slot />
    </div>
  </section>
</template>
