<script setup lang="ts">
import AppSpinner from '@/components/AppSpinner.vue'

defineProps<{ label: string }>()
</script>

<template>
  <div
    role="status"
    class="text-primary flex flex-1 flex-col items-center justify-center gap-4 py-16"
  >
    <AppSpinner :size="40" />
    <span class="text-muted">{{ label }}</span>
  </div>
</template>
