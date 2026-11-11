<script setup lang="ts">
import plusCircleIcon from '@/assets/icons/plus-circle.svg'

const { size = 'md' } = defineProps<{ size?: 'md' | 'lg' }>()
</script>

<template>
  <RouterLink
    :to="{ name: 'project-new' }"
    class="bg-primary inline-flex items-center justify-center gap-3 rounded-full text-white transition hover:brightness-110"
    :class="size === 'lg' ? 'text-button-lg h-13 px-10' : 'text-body h-10 px-6'"
  >
    <img :src="plusCircleIcon" alt="" width="24" height="24" />
    Novo projeto
  </RouterLink>
</template>
