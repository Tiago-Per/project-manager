<script setup lang="ts">
import arrowLeftIcon from '@/assets/icons/arrow-left.svg'
</script>

<template>
  <RouterLink
    :to="{ name: 'projects' }"
    class="text-primary flex w-fit items-center gap-2 hover:underline"
  >
    <img :src="arrowLeftIcon" alt="" width="16" height="16" />
    Voltar
  </RouterLink>
</template>
