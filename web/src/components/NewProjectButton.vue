<script setup lang="ts">
import plusCircleIcon from '@/assets/icons/plus-circle.svg'
import AppButton from '@/components/AppButton.vue'

const { size = 'md' } = defineProps<{ size?: 'md' | 'lg' }>()
</script>

<template>
  <AppButton :to="{ name: 'project-new' }" :size="size">
    <img :src="plusCircleIcon" alt="" width="24" height="24" />
    Novo projeto
  </AppButton>
</template>
