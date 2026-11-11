<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />
    <RouterView />
  </div>
</template>
