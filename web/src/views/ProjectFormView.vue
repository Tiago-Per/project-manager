<script setup lang="ts">
defineProps<{ id?: number }>()
</script>

<template>
  <main>
    <h1>{{ id ? 'Editar projeto' : 'Novo projeto' }}</h1>
  </main>
</template>
